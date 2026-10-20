import numpy as np, struct
from scipy.spatial import cKDTree
f=open('../dl/smica1024.fits','rb'); f.seek(2880*2)  # primary hdr 1 block; ext hdr: count
# find data start: scan header blocks of extension
f.seek(0); blocks=0
def hdr():
    global blocks
    while True:
        b=f.read(2880); blocks+=1
        if any(b[i:i+80].startswith(b'END ') or b[i:i+80].rstrip()==b'END' for i in range(0,2880,80)): return
hdr(); hdr()
N=12582912
raw=np.frombuffer(f.read(N*14),dtype=np.dtype([('I','>f4'),('Q','>f4'),('U','>f4'),('T','u1'),('P','u1')]))
I=raw['I'].astype(np.float64)*1e6; T=raw['T'].astype(np.float64)  # µK
print('I µK rms',I.std(),'min',I.min(),'max',I.max(),'mask frac',T.mean())
# ---- HEALPix helpers
def compress(v):
    v=v&0x5555555555555555
    v=(v|(v>>1))&0x3333333333333333; v=(v|(v>>2))&0x0F0F0F0F0F0F0F0F
    v=(v|(v>>4))&0x00FF00FF00FF00FF; v=(v|(v>>8))&0x0000FFFF0000FFFF; v=(v|(v>>16))&0x00000000FFFFFFFF
    return v
JRLL=np.array([2,2,2,2,3,3,3,3,4,4,4,4]); JPLL=np.array([1,3,5,7,0,2,4,6,1,3,5,7])
def nest2ring(ns,ipn):
    ipn=ipn.astype(np.int64); npf=ns*ns; face=ipn//npf; ipf=ipn%npf
    ix=compress(ipf); iy=compress(ipf>>1)
    npix=12*ns*ns; ncap=2*ns*(ns-1); nl4=4*ns
    jr=JRLL[face]*ns-ix-iy-1
    nr=np.where(jr<ns,jr,np.where(jr>3*ns,4*ns-jr,ns))
    start=np.where(jr<ns,2*nr*(nr-1),np.where(jr>3*ns,npix-2*(nr+1)*nr,ncap+(jr-ns)*4*ns))
    ksh=np.where((jr<ns)|(jr>3*ns),0,(jr-ns)&1)
    jp=(JPLL[face]*nr+ix-iy+1+ksh)//2
    jp=np.where(jp>nl4,jp-nl4,np.where(jp<1,jp+nl4,jp))
    return start+jp-1
def pix2ang_ring(ns,p):
    p=p.astype(np.int64); npix=12*ns*ns; ncap=2*ns*(ns-1)
    z=np.empty(len(p)); phi=np.empty(len(p))
    n=p<ncap; s=p>=npix-ncap; e=~n&~s
    iring=((1+np.sqrt(1+2*p[n]))//2).astype(np.int64); iphi=p[n]-2*iring*(iring-1)+1
    z[n]=1-iring**2/(3.0*ns*ns); phi[n]=(iphi-0.5)*np.pi/(2*iring)
    ip=p[e]-ncap; iring=ip//(4*ns)+ns; iphi=ip%(4*ns)+1; fodd=np.where((iring+ns)&1,1,0.5)
    z[e]=(2*ns-iring)*2.0/(3*ns); phi[e]=(iphi-fodd)*np.pi/(2*ns)
    ip=npix-p[s]; iring=((1+np.sqrt(2*ip-1))//2).astype(np.int64); iphi=4*iring+1-(ip-2*iring*(iring-1))
    z[s]=-1+iring**2/(3.0*ns*ns); phi[s]=(iphi-0.5)*np.pi/(2*iring)
    return z,phi
def ang2pix_ring(ns,z,phi):
    za=np.abs(z); tt=np.mod(phi,2*np.pi)/(np.pi/2); npix=12*ns*ns; ncap=2*ns*(ns-1)
    out=np.empty(len(z),dtype=np.int64)
    e=za<=2/3
    t1=ns*(0.5+tt[e]); t2=ns*z[e]*0.75
    jp=(t1-t2).astype(np.int64); jm=(t1+t2).astype(np.int64)
    ir=ns+1+jp-jm; ks=1-(ir&1); ip=(jp+jm-ns+ks+1)//2; ip=np.mod(ip,4*ns)
    out[e]=ncap+(ir-1)*4*ns+ip
    c=~e; tp=tt[c]-np.floor(tt[c]); tmp=ns*np.sqrt(3*(1-za[c]))
    jp=(tp*tmp).astype(np.int64); jm=((1-tp)*tmp).astype(np.int64); ir=jp+jm+1
    ip=(tt[c]*ir).astype(np.int64); ip=np.mod(ip,4*ir)
    out[c]=np.where(z[c]>0,2*ir*(ir-1)+ip,npix-2*ir*(ir+1)+ip)
    return out
# self-test: ring roundtrip
for ns in (64,512):
    p=np.arange(12*ns*ns); z,ph=pix2ang_ring(ns,p); assert (ang2pix_ring(ns,z,ph)==p).all(); print('ring roundtrip ok',ns)
    r=nest2ring(ns,p); assert len(np.unique(r))==len(p); print('nest2ring is a permutation',ns)
# nested geometry check: children of a nested pixel at ns are 4 consecutive at 2ns; their centres must be near parent's
ns=512; p=np.random.randint(0,12*ns*ns,2000)
zp,php=pix2ang_ring(ns,nest2ring(ns,p))
zc,phc=pix2ang_ring(2*ns,nest2ring(2*ns,4*p+np.random.randint(0,4,len(p))))
def vec(z,ph): s=np.sqrt(1-z*z); return np.stack([s*np.cos(ph),s*np.sin(ph),z],1)
ang=np.degrees(np.arccos(np.clip((vec(zp,php)*vec(zc,phc)).sum(1),-1,1)))*60
print('parent-child max sep arcmin',ang.max(),'(pixel ~6.9)')
# ---- downgrade 1024 -> 512 nested, reorder to ring
I512n=I.reshape(-1,4).mean(1); M512n=T.reshape(-1,4).mean(1)
r=nest2ring(512,np.arange(12*512*512))
I512=np.empty_like(I512n); I512[r]=I512n; M512=np.empty_like(M512n); M512[r]=M512n
q=np.clip(np.round(I512/4),-127,127).astype(np.int8)
print('clipped frac',(np.abs(I512)>508).mean())
# mask: 1 bit per pixel where <50% of children are in the confidence mask
bits=np.packbits((M512<0.5).astype(np.uint8),bitorder='little')
# ---- COBE-like: downgrade to 64 then gaussian 7 deg FWHM
I64n=I.reshape(-1,(1024//64)**2).mean(1); r64=nest2ring(64,np.arange(12*64*64)); I64=np.empty_like(I64n); I64[r64]=I64n
z,ph=pix2ang_ring(64,np.arange(12*64*64)); V=vec(z,ph); tree=cKDTree(V)
sig=np.radians(7/2.3548); rad=2*np.sin(3.5*sig/2)
C64=np.empty_like(I64)
for i,nb in enumerate(tree.query_ball_point(V,rad)):
    d=np.arccos(np.clip(V[nb]@V[i],-1,1)); w=np.exp(-0.5*(d/sig)**2); C64[i]=(w*I64[nb]).sum()/w.sum()
print('COBE-beam rms µK',C64.std(), 'max', np.abs(C64).max())
qc=np.clip(np.round(C64/1.25),-127,127).astype(np.int8)
hdr=b'CMB1'+struct.pack("<IIff",512,64,4.0,1.25)
open('cmb-planck.bin','wb').write(hdr+q.tobytes()+bits.tobytes()+qc.tobytes())
import os; print('bytes',os.path.getsize('cmb-planck.bin'))
np.save('I512.npy',I512)
