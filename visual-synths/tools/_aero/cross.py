exec(open('vgr.py').read().split('# --- validate')[0].replace("open('voyager-ephemeris.bin','wb').write(out); print(len(out))",""))
exec(open('vgr.py').read().split('# --- validate')[1].split('\n',1)[1].split('import re')[0])
import numpy as np
for sc in ['v1','v2']:
    a=bodies[sc]; jds=np.arange(a[2,0],a[-3,0],0.25); ld=np.array([down(sc,j)/C for j in jds])
    s=np.sign(ld-1); idx=np.where(np.diff(s)!=0)[0]
    for i in idx:
        lo,hi=jds[i],jds[i+1]
        for _ in range(40):
            m=(lo+hi)/2
            if (down(sc,m)/C-1)*(down(sc,lo)/C-1)<=0: hi=m
            else: lo=m
        jd=(lo+hi)/2; from datetime import datetime,timedelta
        print(sc,'crosses 1 LD at TDB',datetime(2000,1,1,12)+timedelta(days=jd-2451545.0),'(UTC = TDB - 69.18 s)', 'up' if s[i+1]>0 else 'down')
