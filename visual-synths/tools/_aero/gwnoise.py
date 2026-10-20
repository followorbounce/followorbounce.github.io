import numpy as np
exec(open('gwcmp.py').read().split('# NR resampled')[0])
import gzip
from scipy.signal import butter, filtfilt, iirnotch
x=np.loadtxt(gzip.open('../dl/H-H1.txt.gz'),comments='#')
X=np.fft.rfft(x); fr=np.fft.rfftfreq(len(x),1/fs); wd=np.fft.irfft(X/np.sqrt(np.interp(fr,fw,P)),n=len(x))
b,a=butter(4,[35/(fs/2),350/(fs/2)],btype='band'); wd=filtfilt(b,a,wd)
for f0 in (60,120,180):
    bn,an=iirnotch(f0,30,fs); wd=filtfilt(bn,an,wd)
t=1126259447+np.arange(len(x))/fs-1126259462.4204
tg=np.arange(tn[0],tn[-1],1/fs); hg=np.interp(tg,tn,hn); tpk=tg[np.argmax(np.abs(hg))]
wc=wht(hg); ws=wht(hil(hg))
res=[]
for off in np.arange(-12,-1,0.5):
    s=(t>off-0.35)&(t<off+0.08); seg=wd[s]; ts=t[s]-off; best=0
    for lag in np.arange(-0.04,0.04,1/fs):
        c=np.interp(ts,tg-tpk+lag,wc,left=0,right=0); q=np.interp(ts,tg-tpk+lag,ws,left=0,right=0)
        best=max(best,np.hypot(c@seg,q@seg)/np.sqrt(c@c)/np.sqrt(seg@seg))
    res.append(best)
print('noise-only NR overlap: mean %.3f max %.3f over %d windows'%(np.mean(res),np.max(res),len(res)))
