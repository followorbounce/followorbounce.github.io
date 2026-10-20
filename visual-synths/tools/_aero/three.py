exec(open('cross.py').read().split('import numpy as np\nfor sc')[0])
import numpy as np
from datetime import datetime,timedelta
def up(sc,jd):
    E=herm(bodies['earth'],jd); tau=0
    for _ in range(6): tau=np.linalg.norm(herm(bodies[sc],jd+tau)-E)/C
    return tau
def geo(sc,jd): return np.linalg.norm(herm(bodies[sc],jd)-herm(bodies['earth'],jd))/C
def solve(f,lo,hi):
    for _ in range(60):
        m=(lo+hi)/2
        if (f(m)-1)*(f(lo)-1)<=0: hi=m
        else: lo=m
    return (lo+hi)/2
for sc,j0 in [('v1',2461360.0),('v2',2464630.0)]:
    for name,f in [('instantaneous',lambda j:geo(sc,j)),('downlink',lambda j:down(sc,j)/C),('uplink',lambda j:up(sc,j))]:
        # bracket around j0 +-20 d
        js=np.arange(j0-60,j0+60,0.5); v=[f(j)-1 for j in js]; i=[k for k in range(len(v)-1) if v[k]<=0<v[k+1]][0]
        jd=solve(f,js[i],js[i+1]); utc=datetime(2000,1,1,12)+timedelta(days=jd-2451545.0)-timedelta(seconds=69.184)
        print(sc,name,utc.strftime('%Y-%m-%d %H:%M:%S'),'UTC')
