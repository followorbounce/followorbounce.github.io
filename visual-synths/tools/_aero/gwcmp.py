import numpy as np
exec(open('gwmodel.py').read().split('z=1.09')[0])
nr=np.loadtxt('../dl/GW150914_4_NR_waveform.txt')   # time relative to? GPS 1126259462.44 in the tutorial (peak near 0)
tn=nr[:,0]; hn=nr[:,1]
print('NR peak at t=',tn[np.argmax(np.abs(hn))], 'span',tn[0],tn[-1], 'dt', tn[1]-tn[0])
N=8192
fr=np.fft.rfftfreq(N,1/fs); asd=np.sqrt(np.interp(fr,fw,P)); band=np.clip((fr-30)/10,0,1)*np.clip((370-fr)/30,0,1)
def wht(h): return np.fft.irfft(np.fft.rfft(h,N)/asd*band,N)[:len(h)]
def hil(h):  # quadrature
    Hf=np.fft.rfft(h,N); return np.fft.irfft(Hf*-1j,N)[:len(h)]
sel=(td>-0.35)&(td<0.08); dseg=H[sel]; tseg=td[sel]
def overlap(tm,hc,hs,rng=0.04):
    wc,ws=wht(hc),wht(hs); best=(0,0)
    for lag in np.arange(-rng,rng,1/fs):
        c=np.interp(tseg,tm+lag,wc,left=0,right=0); s=np.interp(tseg,tm+lag,ws,left=0,right=0)
        ov=np.hypot(c@dseg,s@dseg)/np.sqrt(c@c)/np.sqrt(dseg@dseg)
        if ov>best[0]: best=(ov,lag)
    return best
# NR resampled to 4096 grid
tg=np.arange(tn[0],tn[-1],1/fs); hg=np.interp(tg,tn,hn); tpk=tg[np.argmax(np.abs(hg))]
print('NR overlap', overlap(tg-tpk,hg,hil(hg)))
for sc in [0.95,1.0,1.05]:
    tm,hc,hs,info=model(35.6*1.09*sc,30.6*1.09*sc)
    print('toy',sc, overlap(tm,hc,hs))
# compare toy vs NR directly (unwhitened, band)
tm,hc,hs,info=model(35.6*1.09,30.6*1.09)
c=np.interp(tg-tpk,tm,hc,left=0,right=0); s=np.interp(tg-tpk,tm,hs,left=0,right=0)
best=0
for lag in range(-80,80):
    cc=np.roll(c,lag); ss=np.roll(s,lag); ov=np.hypot(cc@hg,ss@hg)/np.sqrt(cc@cc)/np.sqrt(hg@hg); best=max(best,(ov,lag))
print('toy vs NR raw', best)
# NR instantaneous frequency near peak
ph=np.unwrap(np.angle(hg+1j*hil(hg))); fi=np.gradient(ph)/(2*np.pi)*fs
for dtm in [-0.1,-0.05,-0.02,-0.01,0,0.005]:
    i=np.argmin(np.abs(tg-tpk-dtm)); print('NR f at',dtm, round(fi[i],1))
fm=np.gradient(np.unwrap(np.arctan2(hs,hc)))/(2*np.pi)*fs
for dtm in [-0.1,-0.05,-0.02,-0.01,0,0.005]:
    i=np.argmin(np.abs(tm-dtm)); print('toy f at',dtm, round(fm[i],1))
