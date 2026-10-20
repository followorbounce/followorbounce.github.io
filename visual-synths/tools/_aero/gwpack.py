import numpy as np, json, base64
exec(open('gwcmp.py').read().split('# NR resampled')[0])
tg=np.arange(tn[0],tn[-1],1/fs); hg=np.interp(tg,tn,hn); tpk=tg[np.argmax(np.abs(hg))]
w=wht(hg)
# best lag with the real template only (signed)
best=(0,0,1)
for lag in np.arange(-0.02,0.02,1/fs/4):
    c=np.interp(tseg,tg-tpk+lag,w,left=0,right=0); r=(c@dseg)/np.sqrt(c@c)/np.sqrt(dseg@dseg)
    if abs(r)>abs(best[0]): best=(r,lag,np.sign(r))
print('signed NR match', best)
r,lag,sg=best
c=np.interp(td,tg-tpk+lag,w,left=0,right=0); amp=(c[sel]@dseg)/(c[sel]@c[sel])
nrw=c*amp
# L1 version: data L1 vs same template shifted
L=np.frombuffer(base64.b64decode(d['L-L1'] if 'L-L1' in d else d['L1']),'<i2').astype(float)
bestL=(0,0)
for lg in np.arange(-0.02,0.02,1/fs/4):
    cc=np.interp(tseg,tg-tpk+lg,w,left=0,right=0); rr=(cc@L[sel])/np.sqrt(cc@cc)/np.sqrt(L[sel]@L[sel])
    if abs(rr)>abs(bestL[0]): bestL=(rr,lg)
print('L1 match',bestL, 'H1-L1 delay ms', (lag-bestL[1])*1000)
# analytic signal of NR (unwhitened) for the visual
N2=8192; Hf=np.fft.rfft(hg,N2); an=np.fft.irfft(Hf,N2)[:len(hg)]+1j*np.fft.irfft(Hf*-1j,N2)[:len(hg)]
A=np.abs(an); A/=A.max(); ph=np.unwrap(np.angle(an))/(2*np.pi)
ph-=ph[np.argmax(A)]
# ASD grid
fgrid=np.round(np.geomspace(20,1000,120),2); asdg=np.sqrt(np.interp(fgrid,fw,P))
out={'fs':fs,'t0':-0.9,'gps_ref':1126259462.4204,'n':len(H),
 'H1':d['H1'],'L1':d['L1'],
 'nrw':base64.b64encode(np.round(nrw).astype('<i2').tobytes()).decode(),
 'nr':{'t0':round(float(tg[0]-tpk),6),'A':[round(float(x),4) for x in A[::1]],'ph':[round(float(x),4) for x in ph[::1]]},
 'nr_lag':round(float(lag),5),'nr_match':round(float(abs(r)),3),'l1_lag':round(float(bestL[1]),5),
 'asd_f':fgrid.tolist(),'asd':[float('%.4g'%a) for a in asdg]}
json.dump(out,open('gw150914-data.json','w'),separators=(',',':'))
import os; print(os.path.getsize('gw150914-data.json'))
