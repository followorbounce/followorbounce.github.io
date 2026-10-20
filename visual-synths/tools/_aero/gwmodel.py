import numpy as np, json, base64, gzip
from scipy.signal import welch
TS=4.925490947e-6  # GM_sun/c^3 s
def model(m1,m2,fs=4096,flo=25,tpost=0.06):
    M=m1+m2; eta=m1*m2/M**2; Mc=M*eta**0.6
    af=2*np.sqrt(3)*eta-3.871*eta**2+4.028*eta**3
    Erad=(1-np.sqrt(8/9))*eta+0.498*eta**2; Mf=M*(1-Erad)
    frd=(1-0.63*(1-af)**0.3)/(2*np.pi*TS*Mf); Q=0.7+1.4187*(1-af)**-0.4990; trd=Q/(np.pi*frd)
    tau=lambda f:5/256*(TS*Mc)**(-5/3)*(np.pi*f)**(-8/3)
    finsp=lambda ta:(256*ta/5)**(-3/8)*(TS*Mc)**(-5/8)/np.pi
    fdot=lambda f:96/5*np.pi**(8/3)*(TS*Mc)**(5/3)*f**(11/3)
    fj=0.5*frd; tj=-tau(fj)  # time relative to formal coalescence
    tm=(frd-fj)/fdot(fj)
    t=np.arange(-tau(flo),tj+ 8*tm+tpost,1/fs)
    f=np.where(t<tj, finsp(np.maximum(-t,1e-9)), frd-(frd-fj)*np.exp(-(t-tj)/tm))
    A=f**(2/3)
    # peak where f reaches 0.95 frd
    tpk=tj+tm*np.log((frd-fj)/(0.05*frd))
    Apk=(0.95*frd)**(2/3)
    A=np.where(t<tpk, A, Apk*np.exp(-(t-tpk)/trd))
    ph=2*np.pi*np.cumsum(f)/fs
    return t-tpk, A*np.cos(ph), A*np.sin(ph), dict(Mc=Mc,eta=eta,af=af,Mf=Mf,frd=frd,trd=trd,Erad=Erad*M)
d=json.load(open('gw150914.json')); fs=4096
H=np.frombuffer(base64.b64decode(d['H1']),'<i2').astype(float)
td=-0.9+np.arange(len(H))/fs
# ASD of H1 (same as gw.py)
x=np.loadtxt(gzip.open('../dl/H-H1.txt.gz'),comments='#'); fw,P=welch(x,fs,nperseg=4*fs)
z=1.09
for scale in [0.9,0.95,1.0,1.05,1.1]:
    tm,hc,hs,info=model(35.6*z*scale,30.6*z*scale)
    # whiten + band-limit model in freq domain
    N=8192
    def wht(h):
        Hf=np.fft.rfft(h,N); fr=np.fft.rfftfreq(N,1/fs); asd=np.sqrt(np.interp(fr,fw,P))
        band=np.clip((fr-30)/10,0,1)*np.clip((370-fr)/30,0,1)
        return np.fft.irfft(Hf/asd*band,N)[:len(h)]
    wc,ws=wht(hc),wht(hs)
    best=(0,0,0)
    # place model on data grid: model sample i at data time tm[i]+lag
    sel=(td>-0.35)&(td<0.08); dseg=H[sel]; tseg=td[sel]
    for lag in np.arange(-0.02,0.02,1/fs):
        c=np.interp(tseg,tm+lag,wc,left=0,right=0); s=np.interp(tseg,tm+lag,ws,left=0,right=0)
        a=(c@dseg); b=(s@dseg); nrm=np.sqrt(c@c)*np.sqrt(dseg@dseg)
        ov=np.hypot(a,b)/nrm
        if ov>best[0]: best=(ov,lag,np.arctan2(b,a))
    print('mass scale',scale,'Mc_det %.1f'%info['Mc'],'overlap %.3f'%best[0],'lag ms %.1f'%(best[1]*1000),'frd %.0f trd ms %.1f af %.2f Erad %.2f'%(info['frd'],info['trd']*1000,info['af'],info['Erad']))
