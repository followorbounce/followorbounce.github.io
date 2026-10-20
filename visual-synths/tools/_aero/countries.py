import json, numpy as np
from PIL import Image, ImageDraw
t=json.load(open('../dl2/countries-50m.json')); sx,sy=t['transform']['scale']; tx,ty=t['transform']['translate']
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
geoms=t['objects']['countries']['geometries']
names=sorted(set(g['properties']['name'] for g in geoms))
AFRICA=set("""Algeria|Angola|Benin|Botswana|Burkina Faso|Burundi|Cameroon|Cabo Verde|Central African Rep.|Chad|Comoros|Congo|Dem. Rep. Congo|Côte d'Ivoire|Djibouti|Egypt|Eq. Guinea|Eritrea|eSwatini|Ethiopia|Gabon|Gambia|Ghana|Guinea|Guinea-Bissau|Kenya|Lesotho|Liberia|Libya|Madagascar|Malawi|Mali|Mauritania|Mauritius|Morocco|Mozambique|Namibia|Niger|Nigeria|Rwanda|São Tomé and Principe|Senegal|Seychelles|Sierra Leone|Somalia|Somaliland|South Africa|S. Sudan|Sudan|Tanzania|Togo|Tunisia|Uganda|W. Sahara|Zambia|Zimbabwe""".split('|'))
missing=[n for n in AFRICA if n not in names]; print('africa names missing:',missing)
GROUPS=[('Greenland',{'Greenland'}),('Africa',AFRICA),('Australia',{'Australia'}),('India',{'India'}),('Brazil',{'Brazil'}),('Russia',{'Russia'}),('United Kingdom',{'United Kingdom'}),('Dem. Rep. Congo',{'Dem. Rep. Congo'}),('Indonesia',{'Indonesia'}),('United States',{'United States of America'}),('China',{'China'})]
for g,s in GROUPS:
    for n in s:
        if n not in names: print('missing',g,n)
W,H=4096,2048
acc=np.zeros((H,W,4),np.uint8)
X=lambda lo:(lo+180)/360*W; Y=lambda la:(90-la)/180*H
for gid,(gname,members) in enumerate(GROUPS, start=1):
    img=Image.new('L',(W,H),0); d=ImageDraw.Draw(img)
    for g in geoms:
        if g['properties']['name'] not in members or 'arcs' not in g: continue
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
                if abs(un[-1][0]-un[0][0])>350:
                    pole=-90 if sum(p[1] for p in un)/len(un)<0 else 90
                    un=un+[(un[-1][0],pole),(un[0][0],pole)]
                for o in (-360,0,360):
                    pts=[(X(p[0]+o),Y(p[1])) for p in un]
                    if len(pts)>2: d.polygon(pts, fill=255 if i==0 else 0)
    m=np.array(img)>127; b=gid-1; acc[...,b//8][m] |= np.uint8(1<<(b%8))
acc[...,3]=255
lat=np.deg2rad(90-(np.arange(H)+.5)/H*180); cell=(6371.0**2)*np.cos(lat)*(np.pi/H)*(2*np.pi/W)
for gid,(gname,_) in enumerate(GROUPS, start=1):
    b=gid-1; m=(acc[...,b//8]>>(b%8))&1==1; area=(m*cell[:,None]).sum(); print(f'{gid} {gname}: {area/1e6:.3f} million km2')
Image.fromarray(acc,'RGBA').save('countries-id.png', optimize=True)
json.dump([g for g,_ in GROUPS], open('groups.json','w'))
import os; print(os.path.getsize('countries-id.png'))
