import json, numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import distance_transform_edt
t=json.load(open('../dl2/land-50m.json')); sx,sy=t['transform']['scale']; tx,ty=t['transform']['translate']
arcs=[]
for a in t['arcs']:
    x=y=0; pts=[]
    for p in a: x+=p[0]; y+=p[1]; pts.append((x*sx+tx, y*sy+ty))
    arcs.append(pts)
def ring(idx):
    out=[]
    for k in idx:
        a=arcs[k] if k>=0 else arcs[~k][::-1]
        out+= a if not out else a[1:]
    return out
S=4; W,H=4096*S//2,2048*S//2   # render at 2x then downsample for antialiasing-free mask at 4096
W,H=8192,4096
img=Image.new('L',(W,H),0); d=ImageDraw.Draw(img)
X=lambda lo:(lo+180)/360*W; Y=lambda la:(90-la)/180*H
for g in t['objects']['land']['geometries']:
    polys=[g['arcs']] if g['type']=='Polygon' else g['arcs']
    for poly in polys:
        for i,r in enumerate(poly):
            rr=ring(r); un=[]; off=0
            for j,p in enumerate(rr):
                if j:
                    dl=p[0]+off-un[-1][0]
                    if dl>180: off-=360
                    elif dl<-180: off+=360
                un.append((p[0]+off,p[1]))
            # a ring that wraps the whole globe (Antarctica) must be closed through the pole
            span=un[-1][0]-un[0][0]
            if abs(span)>350:
                pole=-90 if sum(p[1] for p in un)/len(un)<0 else 90
                un=un+[(un[-1][0],pole),(un[0][0],pole)]
            for o in (-360,0,360):
                pts=[(X(p[0]+o),Y(p[1])) for p in un]
                if len(pts)>2: d.polygon(pts, fill=255 if i==0 else 0)
m=np.array(img)>127
print('land fraction (pixels)',m.mean())
lat=np.deg2rad(90-(np.arange(H)+.5)/H*180); w=np.cos(lat)[:,None]
print('land area fraction',(m*w).sum()/(w.sum()*W))
# signed distance in 8192 px units, then downsample 2x
din=distance_transform_edt(m); dout=distance_transform_edt(~m)
sd=(dout-din)  # positive in water
sd=sd.reshape(H//2,2,W//2,2).mean(axis=(1,3))/2.0   # in 4096-px units
q=np.clip(128 - sd*16, 0, 255).astype(np.uint8)       # 255 deep land, 0 deep water, 128 = coast; 16 levels per px
Image.fromarray(q).save('land-sdf.png', optimize=True)
import os; print(os.path.getsize('land-sdf.png'))
Image.fromarray(q[::4,::4]).save('land-prev.png')
