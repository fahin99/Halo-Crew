"""Standard-library GLB export from FreeCAD tessellation; Pillow for annotation sheets.
Run after the generation/inspection macros, in their output directory.
"""
import json,struct,math,os
from pathlib import Path
import numpy as np
from PIL import Image,ImageDraw,ImageFont
BASE=Path(__file__).resolve().parent
meshes=json.loads((BASE/'geometry.json').read_text())
binary=bytearray();views=[];accessors=[];materials=[];gmeshes=[];nodes=[]
def acc(a,component,typ,target):
 a=np.ascontiguousarray(a);offset=len(binary);binary.extend(a.tobytes())
 while len(binary)%4:binary.append(0)
 vi=len(views);views.append({'buffer':0,'byteOffset':offset,'byteLength':a.nbytes,'target':target})
 data={'bufferView':vi,'componentType':component,'count':len(a),'type':typ}
 if typ=='VEC3':data.update(min=a.min(axis=0).tolist(),max=a.max(axis=0).tolist())
 accessors.append(data);return len(accessors)-1
for i,m in enumerate(meshes):
 v=np.array(m['vertices'],dtype=np.float32);f=np.array(m['faces'],dtype=np.uint32)
 if len(f)==0:continue
 # FreeCAD Z-up mm -> glTF Y-up meters. Right-handed transform.
 v=v[:,[0,2,1]];v[:,2]*=-1;v/=1000
 tris=v[f];n=np.cross(tris[:,1]-tris[:,0],tris[:,2]-tris[:,0]);n/=np.maximum(np.linalg.norm(n,axis=1,keepdims=True),1e-12)
 verts=tris.reshape(-1,3);norm=np.repeat(n,3,axis=0).astype(np.float32)
 pa=acc(verts,5126,'VEC3',34962);na=acc(norm,5126,'VEC3',34962)
 rgba=m['color']+[.30 if m['transparent'] else 1]
 mat={'name':m['name']+'_material','pbrMetallicRoughness':{'baseColorFactor':rgba,'metallicFactor':.35 if 'Lens' not in m['name'] else .05,'roughnessFactor':.38},'doubleSided':True}
 if m['transparent']:mat['alphaMode']='BLEND'
 materials.append(mat);gmeshes.append({'name':m['name'],'primitives':[{'attributes':{'POSITION':pa,'NORMAL':na},'material':len(materials)-1}]})
 nodes.append({'name':m['name'],'mesh':len(gmeshes)-1,'extras':{'CADComponent':m['name'],'geometryStatus':'Unvalidated engineering concept','explodeOffset_mm':m['offset']}})
g={'asset':{'version':'2.0','generator':'HaloCrew FreeCAD tessellation exporter'},'scene':0,'scenes':[{'name':'VisionGuard complete system','nodes':list(range(len(nodes)))}],'nodes':nodes,'meshes':gmeshes,'materials':materials,'buffers':[{'byteLength':len(binary)}],'bufferViews':views,'accessors':accessors}
j=json.dumps(g,separators=(',',':')).encode();j+=b' '*((-len(j))%4)
payload=struct.pack('<II',len(j),0x4E4F534A)+j+struct.pack('<II',len(binary),0x004E4942)+binary
(BASE/'HaloCrew_VisionGuard_Web.glb').write_bytes(struct.pack('<III',0x46546C67,2,12+len(payload))+payload)
print('GLB:',len(nodes),'named meshes')
# Engineering presentation: real CAD raster with projection-grounded arrows.
font='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
def F(s):return ImageFont.truetype(font,s)
ink=(24,40,58);gray=(84,104,120);cyan=(0,153,180);bg=(245,248,251)
funcs={
'IR EYE CAMERA':'Pupil, gaze and blink imaging | wearable screening',
'RECESSED IR EMITTER':'NIR illumination package | output / safety unvalidated',
'PROCESSOR PCB':'Metric processing and telemetry | wearable',
'SIX-AXIS IMU':'Acceleration + angular rate | head-motion context',
'MICRODISPLAY':'Visual-target source | wearable concept',
'OPTICAL COUPLER':'Folded near-eye path | prescription TBD',
'AMBIENT LIGHT':'Ambient illuminance | measurement context',
'TEMPERATURE':'Local temperature | environment context',
'HUMIDITY':'Local relative humidity | environment context',
'BATTERY CELL':'Protected cell envelope | wearable power',
'POWER-MANAGEMENT PCB':'Charging and regulated power | wearable',
'TELEMETRY ANTENNA':'Wireless link | RF design unvalidated',
'VISIONGUARD GLASSES':'Continuous eye metrics + motion / environment context',
'CONCEPT OCT':'Scheduled retinal / optic-nerve cross-section imaging',
'FUNDUS CAMERA':'Scheduled retinal and optic-disc photography',
'REFRACTION TEST':'Manual subjective lens / target assessment',
'ULTRASOUND':'Separate instrument | structural ocular assessment',
'REBOUND TONOMETER':'Separate instrument | conceptual IOP measurement',
'VISUAL TEST STATION':'Acuity, contrast, Amsler + exploratory field tests',
'EXAMINATION DOCK':'Independent load-bearing alignment and docking stand'}

def sheet(raw,output,title,subtitle):
 img=Image.open(BASE/(raw+'.png')).convert('RGB');anchors=json.loads((BASE/(raw+'_anchors.json')).read_text())
 W,H=2600,1800;canvas=Image.new('RGB',(W,H),bg);d=ImageDraw.Draw(canvas)
 d.rectangle((0,0,W,155),fill=ink);d.text((70,40),title,font=F(45),fill='white');d.text((73,105),subtitle,font=F(22),fill=(162,211,223))
 # Shrink viewport into center panel; annotation margin remains clear.
 scale=.86;imageW,imageH=round(2000*scale),round(1400*scale);ix=(W-imageW)//2;iy=230
 canvas.paste(img.resize((imageW,imageH)),(ix,iy))
 # Distribute numbered arrow labels on left and right, keep all sensor entries legible.
 sorted_anchors=sorted(anchors,key=lambda a:a['x']);half=math.ceil(len(anchors)/2)
 for side,arr in [('L',sorted_anchors[:half]),('R',sorted_anchors[half:])]:
  arr=sorted(arr,key=lambda a:a['y'])
  for j,a in enumerate(arr):
   py=300+j*(1080/max(1,len(arr)-1));lx=55 if side=='L' else W-415;endx=lx+335 if side=='L' else lx
   target=(ix+a['x']*scale,iy+a['y']*scale)
   d.line([(endx,py+24),(endx+(28 if side=='L' else -28),py+24),target],fill=cyan,width=3)
   # An arrowhead terminating at the actual CAD component center.
   prev=(endx+(28 if side=='L' else -28),py+24);dx=target[0]-prev[0];dy=target[1]-prev[1];r=math.hypot(dx,dy) or 1;ux,uy=dx/r,dy/r
   d.polygon([target,(target[0]-14*ux+6*uy,target[1]-14*uy-6*ux),(target[0]-14*ux-6*uy,target[1]-14*uy+6*ux)],fill=cyan)
   number,label=a['label'].split(' | ',1)
   d.rounded_rectangle((lx,py,lx+335,py+77),radius=10,fill='white',outline=(197,211,219),width=2)
   d.ellipse((lx+10,py+10,lx+51,py+51),fill=cyan);d.text((lx+17,py+17),number,font=F(18),fill='white')
   # Wrap title to two lines if necessary.
   words=label.split();line='';lines=[]
   for word in words:
    if d.textlength(line+' '+word,font=F(19))>264:lines.append(line);line=word
    else:line=(line+' '+word).strip()
   lines.append(line)
   for k,line in enumerate(lines):d.text((lx+61,py+12+k*23),line,font=F(19),fill=ink)
 # Readable identification legend below CAD picture; compact parallel entries.
 start=1465;colw=820
 for i,a in enumerate(anchors):
  col=i%3;row=i//3;number,label=a['label'].split(' | ',1)
  text=number+'  '+label
  d.text((65+col*colw,start+row*61),text,font=F(18),fill=ink)
  detail=funcs.get(label,'Detachable concept optical component | not validated')
  # Legend details fit line at 17px.
  d.text((65+col*colw,start+row*61+25),detail,font=F(16),fill=gray)
 d.text((65,H-42),'ENGINEERING CONCEPT  •  Geometry is not clinical validation  •  Screening signals do not diagnose SANS',font=F(19),fill=gray)
 canvas.save(BASE/output)
for args in [
('VisionGuard_SystemCalloutsRaw','VisionGuard_AnnotatedFullSystem.png','HALOCREW / VISIONGUARD','Complete modular eye-health concept • true FreeCAD geometry • millimeters'),
('VisionGuard_WearableRaw','VisionGuard_AnnotatedSensors.png','VISIONGUARD / WEARABLE SENSOR MAP','Covers removed for inspection • arrows terminate on actual CAD component geometry'),
('VisionGuard_ExplodedCalloutsRaw','VisionGuard_AnnotatedExploded.png','VISIONGUARD / EXPLODED ASSEMBLY','Covers removed • components separated for identification • schematic assembly offsets'),
('VisionGuard_OCTRaw','VisionGuard_OCT_OpticalInspection.png','VISIONGUARD / CONCEPT OCT','Optical bench inspection • spectral-domain packaging concept • not a ray-traced or clinical design'),
('VisionGuard_FundusRaw','VisionGuard_Fundus_OpticalInspection.png','VISIONGUARD / FUNDUS CAMERA','Optical bench inspection • separate examination unit • performance unvalidated')]:
 if (BASE/(args[0]+'.png')).exists():sheet(*args)
