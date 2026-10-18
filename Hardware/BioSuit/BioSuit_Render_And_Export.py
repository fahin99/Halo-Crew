"""Render the actual FreeCAD tessellation and export GLB. Python: numpy, numba,
Pillow, trimesh. Run after HaloCrew_BioSuit_Generator.FCMacro.
No AI-generated imagery. CAD remains the authoritative model.
"""
import os,json,math
import numpy as np
from numba import njit
from PIL import Image,ImageDraw,ImageFont
import trimesh
OUT=os.path.dirname(os.path.abspath(__file__))
data=json.load(open(os.path.join(OUT,'render_geometry.json')))
for o in data:
    o['v']=np.array(o['vertices'],dtype=np.float64);o['f']=np.array(o['faces'],dtype=np.int32)
FONT='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
BOLD='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
def font(size,bold=False):return ImageFont.truetype(BOLD if bold else FONT,size)
@njit
def raster(xyz,faces,colors,alpha,zbuf,pixels,write_depth):
    h,w=zbuf.shape
    for i in range(len(faces)):
        a,b,c=faces[i];x1,y1,z1=xyz[a];x2,y2,z2=xyz[b];x3,y3,z3=xyz[c]
        den=(y2-y3)*(x1-x3)+(x3-x2)*(y1-y3)
        if abs(den)<1e-10:continue
        xmin=max(0,int(min(x1,x2,x3)));xmax=min(w-1,int(max(x1,x2,x3))+1)
        ymin=max(0,int(min(y1,y2,y3)));ymax=min(h-1,int(max(y1,y2,y3))+1)
        for y in range(ymin,ymax+1):
            for x in range(xmin,xmax+1):
                u=((y2-y3)*(x+.5-x3)+(x3-x2)*(y+.5-y3))/den
                v=((y3-y1)*(x+.5-x3)+(x1-x3)*(y+.5-y3))/den
                t=1-u-v
                if u<-.00001 or v<-.00001 or t<-.00001:continue
                z=u*z1+v*z2+t*z3
                if z<zbuf[y,x]:continue
                for k in range(3):pixels[y,x,k]=pixels[y,x,k]*(1-alpha)+colors[i,k]*alpha
                if write_depth:zbuf[y,x]=z

def basis(az=0,elevation=0):
    eye=np.array([math.sin(az)*math.cos(elevation),-math.cos(az)*math.cos(elevation),math.sin(elevation)])
    right=np.cross(eye,[0,0,1]);right/=np.linalg.norm(right)
    up=np.cross(right,eye)
    return np.array([right,up,eye]).T

def render(mode='full',az=.5,elevation=.14,size=(1700,2200),scale=.99,center=(850,1210),subset=None):
    width,height=size;bg=np.zeros((height,width,3),dtype=np.float64);bg[:]=[242,245,247]
    zbuf=np.full((height,width),-1e12);B=basis(az,elevation)
    if subset is None:
        selected=[o for o in data if o['group']!='Detachable_Medical_Accessories' and
                  (o['group']!='Reference_Body' or o['name'] in ['Reference_Head_Component','Reference_Nose_Component'])]
    else:selected=subset
    triangles=[]
    for o in selected:
        v=o['v'].copy();color=np.array(o['color'][:3]);alpha=1.
        if mode=='exploded' and o['group'] not in ['Reference_Body','Textile_Suit','Flexible_Wiring']:
            ctr=(v.min(axis=0)+v.max(axis=0))/2
            if o['group'] in ['Electronics_Control_Unit','Battery_And_Power']:v+=[0,190,0]
            elif o['group']=='VisionGuard_Interface':v+=[0,-100,100]
            else:v+=[100 if ctr[0]>30 else (-100 if ctr[0]<-30 else 0),-115 if ctr[1]<=0 else 115,0]
        if mode=='transparent':
            if o['group']=='Textile_Suit':alpha=.13;color=np.array([.3,.58,.66])
            elif o['group']=='Torso_Assembly':alpha=.25
            elif o['group']=='Reference_Body':alpha=.22
        elif o['transparency']>0:alpha=1-o['transparency']/100
        tri=v[o['f']]
        normals=np.cross(tri[:,1]-tri[:,0],tri[:,2]-tri[:,0]);normals/=np.maximum(np.linalg.norm(normals,axis=1)[:,None],1e-9)
        light=np.array([-.55,-.65,.9]);light/=np.linalg.norm(light)
        # Two-sided textile/optical surfaces receive softly shaded illumination.
        lambert=np.maximum(normals@light,0)
        fill=np.maximum(normals@np.array([.6,.5,.6]),0)
        shade=.49+.40*lambert+.10*fill
        colors=np.clip(color[None,:]*255*shade[:,None],0,255)
        if 'LED' in o['name'] or 'Indicator' in o['name'] or 'Stripe' in o['name']:colors[:]=color*255
        proj=v@B
        proj[:,0]=center[0]+proj[:,0]*scale
        proj[:,1]=center[1]-proj[:,1]*scale
        triangles.append((alpha,proj,o['f'],colors))
    for alpha,p,f,col in triangles:
        if alpha>=.999:raster(p,f,col,1,zbuf,bg,True)
    for alpha,p,f,col in triangles:
        if alpha<.999:
            idx=np.argsort(p[f][:,:,2].mean(axis=1));raster(p,f[idx],col[idx],alpha,zbuf,bg,False)
    image=Image.fromarray(np.uint8(np.clip(bg,0,255)))
    return image,lambda p:(center[0]+(np.array(p)@B)[0]*scale,center[1]-(np.array(p)@B)[1]*scale)

def decorate(im,title,subtitle,tag):
    d=ImageDraw.Draw(im);w,h=im.size
    d.rectangle((0,0,w,198),fill=(250,252,253))
    d.text((80,42),'HALOCREW  /  BIOSUIT',font=font(25,True),fill=(15,125,145))
    d.text((80,83),title,font=font(49,True),fill=(29,48,60))
    d.text((82,149),subtitle,font=font(22),fill=(81,99,110))
    d.line((80,h-108,w-80,h-108),fill=(181,199,205),width=2)
    d.text((80,h-86),'IVA BIOMEDICAL GARMENT  •  1750 mm reference  •  Editable FreeCAD concept',font=font(19),fill=(66,87,100))
    d.text((80,h-50),'PROPOSED HARDWARE  /  MEDICAL + FLIGHT VALIDATION REQUIRED',font=font(16),fill=(104,121,130))
    d.text((w-190,h-75),tag,font=font(24,True),fill=(15,125,145))
    return im

for filename,title,mode,az,el,sc in [
('BioSuit_Full_View.png','Integrated monitoring suit','full',.52,.10,.94),
('BioSuit_Exploded_View.png','Exploded sensor architecture','exploded',.5,.12,.91),
('BioSuit_Transparent_View.png','Skin contacts + service harness','transparent',.25,.05,.98),
('BioSuit_Front_View.png','Front engineering view','full',0,0,.99),
('BioSuit_Back_View.png','Rear engineering view','full',math.pi,0,.99)]:
    im,_=render(mode,az,el,scale=sc,center=(850,1970))
    decorate(im,title,'Real geometry rendered directly from the FreeCAD assembly',{'full':'01','exploded':'02','transparent':'03'}[mode]).save(os.path.join(OUT,filename))
    print('Rendered',filename,flush=True)

# Annotation sheet: readable component families, leaders terminate at actual coordinates.
im,project=render('transparent',0,0,(2100,2250),.97,(1050,2010))
decorate(im,'Sensors and intended functions','Callouts identify hardware groups; component-level functions are in the CAD tree and BOM','04')
d=ImageDraw.Draw(im)
callouts=[
(110,360,(-106,-100,1320),'ECG + impedance','Rhythm, HRV; respiratory impedance'),
(110,620,(154,-52,1178),'Respiratory stretch bands','Thoracic / abdominal movement'),
(110,880,(144,-80,1055),'Microfluidic sweat cartridge','Exploratory local Na+ / Cl- trends'),
(110,1140,(-94,-63,704),'Surface EMG pairs','Selected muscle activation'),
(110,1420,(-99,-48,400),'Segment IMUs + flex sensors','Motion, orientation and joint movement'),
(110,1710,(-98,-66,15),'Smart insole pressure zones','Contact force during exercise / loading'),
(1530,335,(42,-99,1634),'VisionGuard eyewear','Pupil / blink + visual testing hardware'),
(1530,615,(166,-25,1360),'Exposed environment pod','Local CO2, O2, pressure, temperature/RH'),
(1530,865,(-122,-78,1285),'Radiation dosimeter','Personal exposure logging'),
(1530,1115,(0,135,1230),'Upper-back ECU + battery','Acquisition, processing, storage, power'),
(1530,1420,(386,-15,719),'Replaceable BioGlove','SpO2, PPG, EDA, flex, pressure'),
(1530,1720,(47,-106,1290),'Skin temperature contacts','Chest, upper back, arm and thigh')]
for x,y,p,title,detail in callouts:
    width=460;tx,ty=project(p);start=(x+width if x<1000 else x,y+51)
    elbow=(start[0]+(35 if x<1000 else -35),start[1])
    d.line([start,elbow,(tx,ty)],fill=(19,133,150),width=3)
    vx=elbow[0]-tx;vy=elbow[1]-ty;length=math.hypot(vx,vy);vx/=length;vy/=length
    d.polygon([(tx,ty),(tx+vx*16-vy*6,ty+vy*16+vx*6),(tx+vx*16+vy*6,ty+vy*16-vx*6)],fill=(19,133,150))
    d.rounded_rectangle((x,y,x+width,y+106),radius=12,fill=(250,252,253),outline=(177,207,214),width=2)
    d.text((x+17,y+17),title,font=font(21,True),fill=(28,66,79))
    d.text((x+17,y+55),detail,font=font(16),fill=(66,92,104))
im.save(os.path.join(OUT,'BioSuit_Annotated_View.png'))

# Cutaway ECU rendering excludes the removable lid and keeps battery compartments open.
sub=[o for o in data if o['group'] in ['Electronics_Control_Unit','Battery_And_Power'] and
     o['name'] not in ['ECU_Removable_Cover','Battery_Service_Lid']]
im,_=render('full',2.8,.15,(1700,1700),3.4,(850,4800),sub)
decorate(im,'Serviceable electronics cutaway','Processor, acquisition boards, storage, protected power and keyed connectors','06')
im.save(os.path.join(OUT,'BioSuit_Electronics_Cutaway.png'))

# Detailed sensor specimen sheet, all geometry derived from the saved model.
sheet=Image.new('RGB',(2100,1880),(242,245,247));decorate(sheet,'Medical sensor close-ups',
'Selectable native housings, contacts, PCBs, microchannels and optical packages','07')
specs=[('ECG skin contact + carrier',lambda n:n.startswith('ECG_RA'),math.pi),
       ('EMG contact pair + amplifier',lambda n:n.startswith('Left_Biceps_EMG'),math.pi),
       ('PPG emitter / detector',lambda n:n.startswith('Wrist_PPG'),0),
       ('Sweat cartridge + electrode wells',lambda n:n.startswith('Sweat_'),0),
       ('IMU enclosure + MEMS board',lambda n:n.startswith('Chest_IMU'),math.pi),
       ('Respiratory stretch bands',lambda n:n in ['Thoracic_Respiration_Band','Abdominal_Respiration_Band'],0)]
for idx,(title,match,az) in enumerate(specs):
    sub=[]
    for o in data:
        if not match(o['name']):continue
        if 'ServiceLid' in o['name']:continue
        oo=dict(o);oo['v']=o['v'].copy();sub.append(oo)
        if o['name']=='Sweat_Replaceable_Cartridge':oo['transparency']=0
    vv=np.vstack([o['v'] for o in sub]);ctr=(vv.max(axis=0)+vv.min(axis=0))/2
    for o in sub:
        o['v']-=ctr
    bound=max(np.ptp(vv,axis=0));sc=min(12,430/bound)
    tile,_=render('full',az+.2,.22,(620,660),sc,(310,330),sub)
    x=80+(idx%3)*675;y=225+(idx//3)*705
    sheet.paste(tile,(x,y));dr=ImageDraw.Draw(sheet)
    dr.text((x+15,y+605),title,font=font(21,True),fill=(29,66,79))
sheet.save(os.path.join(OUT,'BioSuit_Medical_Sensor_CloseUp.png'))

# Separate rack presentation.
sub=[o for o in data if o['group']=='Detachable_Medical_Accessories']
im,_=render('full',.3,.04,(1400,1800),.94,(100,1490),sub)
decorate(im,'Optional medical accessories','Cuff BP, sampled capnography, core-temperature telemetry, EEG/EOG and diagnostic dock','08')
im.save(os.path.join(OUT,'BioSuit_Medical_Accessories.png'))

# Standards-conforming GLB with meter units / Y-up axes, named component nodes.
scene=trimesh.Scene()
for o in data:
    if o['group']=='Detachable_Medical_Accessories':continue
    if o['group']=='Reference_Body' and o['name'] not in ['Reference_Head_Component','Reference_Nose_Component']:continue
    vv=o['v'][:,[0,2,1]].copy()/1000;vv[:,2]*=-1
    mesh=trimesh.Trimesh(vv,o['f'],process=False)
    rgba=[round(c*255) for c in o['color'][:3]]+[255-round(o['transparency']*2.55)]
    mat=trimesh.visual.material.PBRMaterial(name=o['name'],baseColorFactor=rgba,
        metallicFactor=.25 if o['group']!='Textile_Suit' else 0,roughnessFactor=.7,
        alphaMode='BLEND' if rgba[3]<255 else 'OPAQUE',doubleSided=True)
    mesh.visual=trimesh.visual.TextureVisuals(material=mat)
    scene.add_geometry(mesh,node_name=o['name'],geom_name=o['name'])
scene.export(os.path.join(OUT,'HaloCrew_BioSuit_Web.glb'))
loaded=trimesh.load(os.path.join(OUT,'HaloCrew_BioSuit_Web.glb'))
assert len(loaded.geometry)==len(scene.geometry)
print('GLB round trip passed:',len(loaded.geometry),'named components',flush=True)
