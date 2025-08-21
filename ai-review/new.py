import cupy as cp
print("GPU memory used:", cp.cuda.runtime.memGetInfo())
