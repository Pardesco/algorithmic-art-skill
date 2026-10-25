# GPU Rendering (Python)

Browser pieces already have the GPU: shaders and three.js (`webgl.md`). This file is for offline Python work: print-resolution rasters, texture stacks, particle systems, simulations. The rule: **heavy work runs on the GPU when the machine has one; the CPU path is the fallback.**

## When it pays

- Per-pixel maths at print size: blurs, noise fields, compositing many layers, tone-mapping. A 24 MP Gaussian blur goes from ~2 s (SciPy) to ~10 ms (CuPy).
- Millions of particles or agents, attractor/IFS density accumulation, flow-field advection, reaction-diffusion, SPH.
- Not worth it: geometry with a few thousand elements, polygon rasterisation with PIL, KD-tree queries. Leave those on the CPU and move only the pixel work.

## Finding the GPU

- Use `$ALGO_ART_GPU_PYTHON` when it is set: an interpreter with the GPU libraries already installed. Otherwise probe with `python -c "import cupy; print(cupy.cuda.runtime.getDeviceCount())"`.
- Card and architecture: `nvidia-smi --query-gpu=name,compute_cap --format=csv`. Compute capability 12.x (RTX 50-series, Blackwell) needs builds for CUDA 12.8 or newer. Older wheels import fine, then crash on the first kernel.
- Put GPU libraries in their own environment (`uv venv`). Upgrading PyTorch inside an old environment breaks compiled add-ons built against it.

## Which library

| Work | Library | Note |
|---|---|---|
| NumPy / `scipy.ndimage` code | **CuPy** (`cupy`, `cupyx.scipy.ndimage`) | near drop-in; port by swapping the module |
| Custom per-element loops: particles, sims, SDFs | **NVIDIA Warp** (`warp-lang`) | Python kernels compiled for CUDA; 10M particles × 100 steps ≈ 0.3 s on a 5070 Ti |
| Neural nets, style transfer, differentiable rendering | **PyTorch** | |

JAX has no native CUDA support on Windows (WSL only).

## Backend switch pattern

Keep one code path and pick the array module at startup:

```python
xp, xnd = np, scipy.ndimage            # default: CPU, reproduces existing renders exactly
def use_gpu():
    global xp, xnd
    import cupy, cupyx.scipy.ndimage
    xp, xnd = cupy, cupyx.scipy.ndimage
```

Make `--gpu` opt-in for code that has already shipped work, so the CPU render stays the reference. New pieces can default to the GPU when it is present.

## Failure → fix

| Symptom | Fix |
|---|---|
| `TypeError: Unsupported type <class 'numpy.ndarray'>` | NumPy and CuPy arrays mixed in one expression. `np.ones_like(gpu)` returns a GPU array, but `* np_colour` then fails. Wrap constants and masks in `xp.asarray`. |
| GPU render slower than expected | Data crossing the bus every step. Keep arrays on the device; convert once in (`xp.asarray`) and once out (`.get()`). |
| GPU output not identical to the CPU reference | GPU random streams differ from NumPy's. For a faithful re-render of approved work, draw on the CPU from the same seed and upload: about 3× slower, matches to float rounding. For new work, seed a GPU generator from the CPU rng. |
| "GPU version is brighter or darker" | Usually a different draw of a large-scale noise field, not a bias. Compare the shift against two CPU seeds before hunting a bug. |
| `NotImplementedError: only brute_force` | `cupyx.scipy.ndimage.binary_dilation(..., iterations>1)` needs `brute_force=True` (same result). |
| Supersampled PIL masks are the CPU bottleneck | Downsample on the GPU. PIL's 8-bit LANCZOS uses 22-bit fixed-point integer weights, horizontal pass first, and can be reproduced bit for bit. |
| Out of memory at print size | A float32 RGB layer at 7200×10800 is ~0.9 GB; count the full-size temporaries per step. Between renders: `cupy.get_default_memory_pool().free_all_blocks()`. |
| Shipped art changes after a library upgrade | Not the GPU: SVD and eigen bases of symmetric shapes are not unique, and a new NumPy/LAPACK can pick another one, which rotates anything oriented from it. Pin the environment that produced sold work, or canonicalise the basis in new code. |
| CuPy can't find `nvrtc64_*.dll` (Windows, pip CUDA wheels) | CuPy 14: install `cupy-cuda13x[ctk]`. CuPy 13: put the wheel's `nvidia/cu13/bin/x86_64` folder on `PATH` (the builtins DLL ignores `os.add_dll_directory`) and set `CUDA_PATH` to `nvidia/cu13`. |

## Verify every port

Render the same piece and seed on both backends, then diff the pixels: report max difference, the share of pixels differing and the share differing by more than 2 levels. When the random numbers come from the CPU, expect only float-rounding noise (a few levels on well under 0.1% of pixels). Then look at a crop side by side. The numbers can't tell you whether the texture still reads the same.
