from time import perf_counter

inicio = perf_counter()
import scipy
print("scipy:", perf_counter() - inicio)

inicio = perf_counter()
import scipy.stats
print("scipy.stats:", perf_counter() - inicio)

inicio = perf_counter()
import scipy.linalg
print("scipy.linalg:", perf_counter() - inicio)

inicio = perf_counter()
import scipy.sparse
print("scipy.sparse:", perf_counter() - inicio)