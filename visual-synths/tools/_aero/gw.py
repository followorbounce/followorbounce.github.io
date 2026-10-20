import numpy as np, gzip, sys, json, base64
from scipy.signal import welch, butter, filtfilt, iirnotch
D = sys.argv[1]
fs = 4096; t0 = 1126259447
def load(n): return np.loadtxt(gzip.open(f'{D}/{n}.txt.gz'), comments='#')
out = {}
tm = 1126259462.4204  # peak, approx (GWOSC tutorial uses 1126259462.44)
for det in ['H-H1', 'L-L1']:
    x = load(det)
    t = t0 + np.arange(len(x))/fs
    f, P = welch(x, fs, nperseg=4*fs)
    # whiten in the frequency domain
    win = np.hanning(len(x))*0+1
    X = np.fft.rfft(x*np.blackman(len(x))**0.0 * 1)
    fr = np.fft.rfftfreq(len(x), 1/fs)
    asd = np.sqrt(np.interp(fr, f, P))
    w = np.fft.irfft(X/asd, n=len(x))
    b, a = butter(4, [35/(fs/2), 350/(fs/2)], btype='band')
    w = filtfilt(b, a, w)
    for f0 in (60, 120, 180):
        bn, an = iirnotch(f0, 30, fs); w = filtfilt(bn, an, w)
    i0 = int(round((tm - 0.9 - t0)*fs)); i1 = i0 + int(1.1*fs)
    seg = w[i0:i1]
    out[det] = seg
    print(det, 'std of segment', seg.std(), 'peak', np.abs(seg).max(), 'peak t', t[i0+np.argmax(np.abs(seg))]-tm)
# normalise jointly, int16
m = max(np.abs(out['H-H1']).max(), np.abs(out['L-L1']).max())
res = {'fs':fs, 'start_rel_peak':-0.9, 'gps_peak':tm, 'n':len(out['H-H1'])}
for det in out:
    q = np.round(out[det]/m*32000).astype('<i2')
    res[det[2:]] = base64.b64encode(q.tobytes()).decode()
json.dump(res, open('gw150914.json','w'))
print(len(open('gw150914.json').read()))
