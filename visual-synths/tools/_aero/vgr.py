import numpy as np, struct, sys
D='../dl/'
def rd(n):
    a=[]
    for l in open(D+f'vec_{n}.csv'):
        p=[x.strip() for x in l.split(',')]
        if len(p)<8: continue
        a.append([float(p[0])]+[float(x) for x in p[2:8]])
    return np.array(a)
bodies={k:rd(k) for k in ['v1','v2','earth','sun','jup','sat','ura','nep']}
# binary: magic, nbodies; per body: jd0(f64), step(f64), n(u32), flags(u32: 1=f64 pos); then pos (f64 or f32)*3n, vel f32*3n
out=bytearray(b'VGR1'); out+=struct.pack('<I',len(bodies))
for k,a in bodies.items():
    hp = k in ('v1','v2','earth')
    jd0=a[0,0]; step=a[1,0]-a[0,0]; n=len(a)
    assert np.allclose(np.diff(a[:,0]),step)
    out+=struct.pack('<ddII',jd0,step,n,1 if hp else 0)
    out+=a[:,1:4].astype('<f8' if hp else '<f4').tobytes()
    out+=a[:,4:7].astype('<f4').tobytes()
    while len(out)%8: out+=b'\0'
open('voyager-ephemeris.bin','wb').write(out); print(len(out))
# --- validate: Hermite interpolation + light time vs Horizons observer delta
def herm(a,jd):
    step=a[1,0]-a[0,0]; u=(jd-a[0,0])/step; i=int(np.floor(u)); s=u-i
    p0,p1=a[i,1:4],a[i+1,1:4]; m0,m1=a[i,4:7]*step,a[i+1,4:7]*step
    h00=2*s**3-3*s**2+1; h10=s**3-2*s**2+s; h01=-2*s**3+3*s**2; h11=s**3-s**2
    return h00*p0+h10*m0+h01*p1+h11*m1
C=299792.458*86400/149597870.700  # AU/day
def down(sc,jd):
    E=herm(bodies['earth'],jd); tau=0
    for _ in range(6): tau=np.linalg.norm(herm(bodies[sc],jd-tau)-E)/C
    return tau*C
import re
errs=[]
for l in open(D+'v31.txt'):
    m=re.match(r'\s*(\d{4}-\w{3}-\d\d \d\d:\d\d),.*',l)
    if not m or '$$' in l: continue
    p=[x.strip() for x in l.split(',')]
    try: delta=float(p[7])
    except: continue
    from datetime import datetime
    dt=datetime.strptime(p[0],'%Y-%b-%d %H:%M')
    jd_utc=2440587.5+(dt-datetime(1970,1,1)).total_seconds()/86400
    # observer table is UT; vectors are TDB. TDB-UTC ~ 32.184+TAI-UTC
    yr=dt.year+dt.timetuple().tm_yday/365.25
    leap=[(1977.0,16),(1978.0,17),(1979.0,18),(1980.0,19),(1981.5,20),(1982.5,21),(1983.5,22),(1985.5,23),(1988.0,24),(1990.0,25),(1991.0,26),(1992.5,27),(1993.5,28),(1994.5,29),(1996.0,30),(1997.5,31),(1999.0,32),(2006.0,33),(2009.0,34),(2012.5,35),(2015.5,36),(2017.0,37)]
    tai=[x[1] for x in leap if x[0]<=yr][-1]
    jd=jd_utc+(32.184+tai)/86400
    if jd<bodies['v1'][3,0] or jd>bodies['v1'][-3,0]: continue
    errs.append((dt.year, (down('v1',jd)-delta)*149597870.7))
e=np.array(errs)
for y in [1978,1980,1990,2000,2010,2020,2026,2030,2036]:
    s=e[e[:,0]==y][:,1]
    if len(s): print(y,'max |err| km',np.abs(s).max().round(1))
# diagnostic: 2020 sample at different offsets
from datetime import datetime
for l in open(D+'v31.txt'):
    if l.startswith(' 2020-Jan-0') or l.startswith(' 2020-Jul-0'):
        p=[x.strip() for x in l.split(',')]; delta=float(p[7]); dd=float(p[8])
        dt=datetime.strptime(p[0],'%Y-%b-%d %H:%M'); jd_utc=2440587.5+(dt-datetime(1970,1,1)).total_seconds()/86400
        for off in [0,37,69.184,100]:
            print(p[0], off, round((down('v1',jd_utc+off/86400)-delta)*149597870.7,1), 'deldot',dd)
