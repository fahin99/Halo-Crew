import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
type Props = {
    kind?: "halo" | "family" | "roadmap" | "hardware" | "domain";
    device?: number;
    domain?: number;
    spin?: boolean;
    exploded?: boolean;
    className?: string;
    onSelect?: (destination: string) => void;
};
export default function SpaceMaterial({ kind = "halo", device = 0, domain = 0, spin = true, exploded = false, className = "", onSelect }: Props) {
    const host = useRef<HTMLDivElement>(null), [failed, setFailed] = useState(false);
    const select = useRef(onSelect); select.current = onSelect;
    const control = useRef({ spin, exploded });
    control.current = { spin, exploded };
    useEffect(() => {
        const element = host.current;
        if (!element)
            return;
        setFailed(false);
        let renderer: THREE.WebGLRenderer;
        try {
            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
        }
        catch {
            setFailed(true);
            return;
        }
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = .95;
        renderer.setClearColor(0, 0);
        element.appendChild(renderer.domElement);
        const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(35, 1, .1, 60);
        camera.position.set(0, kind === "hardware" ? .35 : 0, kind === "hardware" ? 8.4 : 7.4);
        const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment(), environment = pmrem.fromScene(room, .04);
        scene.environment = environment.texture;
        room.dispose();
        pmrem.dispose();
        scene.add(new THREE.HemisphereLight(0xffeaf8, 0x453563, 1.4));
        const key = new THREE.DirectionalLight(0xfff0ed, 2.5);
        key.position.set(-3, 4, 4);
        scene.add(key);
        const rim = new THREE.PointLight(0xff8fda, 35, 18);
        rim.position.set(3, 1, -2);
        scene.add(rim);
        const fill = new THREE.PointLight(0xa8a0ff, 20, 18);
        fill.position.set(-3, -2, 2);
        scene.add(fill);
        const pearl = new THREE.MeshPhysicalMaterial({ color: 0xc4a4de, metalness: .38, roughness: .25, clearcoat: 1, clearcoatRoughness: .1, iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [150, 480], envMapIntensity: .85 });
        const pink = new THREE.MeshPhysicalMaterial({ color: 0xda99c2, metalness: .55, roughness: .22, clearcoat: 1, envMapIntensity: 1.2 });
        const chrome = new THREE.MeshPhysicalMaterial({ color: 0xbeb4e4, metalness: .9, roughness: .19, envMapIntensity: 1.6 });
        const glass = new THREE.MeshPhysicalMaterial({ color: 0xe1c8f6, metalness: .05, roughness: .08, transmission: .7, thickness: .28, ior: 1.4, transparent: true, opacity: .5, clearcoat: 1 });
        const dark = new THREE.MeshStandardMaterial({ color: 0x443354, metalness: .5, roughness: .4 });
        const glow = new THREE.MeshStandardMaterial({ color: 0xffdcf3, emissive: 0xf2a1d3, emissiveIntensity: 1.2, roughness: .25 });
        const root = new THREE.Group();
        scene.add(root);
        const orbit = new THREE.Group();
        root.add(orbit);
        const animated: THREE.Object3D[] = [];
        const components: {
            mesh: THREE.Object3D;
            base: THREE.Vector3;
            offset: THREE.Vector3;
        }[] = [];
        const mesh = (geometry: THREE.BufferGeometry, material: THREE.Material, parent: THREE.Object3D = root) => { const m = new THREE.Mesh(geometry, material); parent.add(m); return m; };
        const ball = (r: number, x: number, y: number, z: number, mat: THREE.Material = pearl, parent: THREE.Object3D = root) => { const m = mesh(new THREE.SphereGeometry(r, 40, 28), mat, parent); m.position.set(x, y, z); return m; };
        const box = (w: number, h: number, d: number, x: number, y: number, z: number, mat: THREE.Material = pearl) => { const m = mesh(new RoundedBoxGeometry(w, h, d, 4, Math.min(w, h, d) * .22), mat); m.position.set(x, y, z); components.push({ mesh: m, base: m.position.clone(), offset: new THREE.Vector3(x * .25, y * .4, z * .25) }); return m; };
        const ring = (r: number, tube: number, mat: THREE.Material, parent: THREE.Object3D = root) => mesh(new THREE.TorusGeometry(r, tube, 16, 100), mat, parent);
        if (kind === "domain") {
            camera.position.z=6.2;
            const pill=(x:number,y:number,z:number,scale: [number,number,number],mat:THREE.Material=pearl)=>{const b=ball(.48,x,y,z,mat);b.scale.set(...scale);return b;};
            if(domain===0){const shape=new THREE.Shape();shape.moveTo(0,-.85);shape.bezierCurveTo(-1.8,.15,-.9,1.6,0,.62);shape.bezierCurveTo(.9,1.6,1.8,.15,0,-.85);const heart=mesh(new THREE.ExtrudeGeometry(shape,{depth:.35,bevelEnabled:true,bevelSize:.12,bevelThickness:.12,bevelSegments:5,curveSegments:24}),pink);heart.position.z=-.2;heart.rotation.z=-.12;}
            if(domain===1){ball(.75,0,0,0,pearl);for(let i=0;i<16;i++){const a=i*2.399;const y=1-i/7.5;const r=Math.sqrt(Math.max(0,1-y*y));ball(.13,Math.cos(a)*r*.95,y*.95,Math.sin(a)*r*.95,i%2?pink:chrome);}ball(.22,.12,.05,.74,glass);}
            if(domain===2){const shaft=box(.42,1.6,.4,0,0,0,pearl);shaft.rotation.z=-.42;for(const sign of [-1,1]){ball(.35,sign*.35,sign*.75,0,pink);ball(.35,sign*.02,sign*.9,0,pearl);}}
            if(domain===3){pill(-.35,0,0,[1,1.35,.9]);pill(.35,0,0,[1,1.35,.9],pink);for(let i=0;i<7;i++){const fold=ring(.36,.075,i%2?pink:pearl);fold.position.set((i%2?1:-1)*.28,(i-3)*.17,.38);fold.scale.set(1,.5,1);fold.rotation.y=.4;}}
            if(domain===4){const moon=new THREE.Shape();moon.absarc(0,0,.95,Math.PI*.28,Math.PI*1.72,false);moon.bezierCurveTo(-.3,-.65,-.3,.65,Math.cos(Math.PI*.28)*.95,Math.sin(Math.PI*.28)*.95);const crescent=mesh(new THREE.ExtrudeGeometry(moon,{depth:.22,bevelEnabled:true,bevelSize:.06,bevelThickness:.06,bevelSegments:3,curveSegments:30}),pearl);crescent.position.z=-.15;ball(.11,.85,.7,0,pink);ball(.07,1.1,.12,0,chrome);}
            if(domain===5){const profile=[new THREE.Vector2(0,-.85),new THREE.Vector2(.35,-.76),new THREE.Vector2(.65,-.4),new THREE.Vector2(.7,0),new THREE.Vector2(.52,.45),new THREE.Vector2(.2,.85),new THREE.Vector2(0,1.2)];mesh(new THREE.LatheGeometry(profile,48),glass);ball(.43,0,-.2,0,pink);}
            if(domain===6){ball(.34,0,0,0,pink);for(let i=0;i<3;i++){const r=ring(.95,.035,chrome);r.rotation.set(i*.9,.7+i*.6,i*.5);}ball(.16,.9,.2,0,pearl);ball(.12,-.6,-.7,.2,pink);}
            if(domain===7){pill(-.44,0,0,[.8,1.65,.8]);pill(.44,0,0,[.8,1.65,.8],pink);box(.13,1,.12,0,.5,.1,chrome);for(const x of [-.4,.4]){const tube=box(.1,.5,.1,x,.2,.4,chrome);tube.rotation.z=x>0?.7:-.7;}}
            if(domain===8){pill(0,0,0,[2,1,.8]);const iris=mesh(new THREE.CylinderGeometry(.37,.37,.15,48),pink);iris.rotation.x=Math.PI/2;iris.position.z=.45;ball(.18,0,0,.56,dark);ball(.06,-.08,.1,.71,glow);}
            if(domain===9){box(.42,1.55,.35,0,0,0,pink);box(1.55,.42,.35,0,0,.01,pearl);const outer=ring(1,.025,chrome);outer.rotation.x=.3;}
            root.rotation.set(.12,-.2,-.05);
        }
        else if (kind !== "hardware") {
            const core = ball(kind === "family" ? .78 : 1, 0, 0, 0, pearl);
            core.userData.destination = "health";
            if (kind === "roadmap") {
                core.scale.set(.8, 1.35, .8);
                core.rotation.z = .25;
            }
            const halo = ring(1.65, .055, pink, orbit);
            halo.rotation.set(.9, .2, -.4);
            const halo2 = ring(1.4, .028, chrome, orbit);
            halo2.rotation.set(-.8, .45, .7);
            const shell = ring(1.05, .028, glass);
            shell.rotation.y = 1;
            for (let i = 0; i < 7; i++) {
                const a = i * Math.PI * 2 / 7;
                const satellite = ball(i % 3 === 0 ? .16 : .09, Math.cos(a) * 1.65, Math.sin(a) * 1.22, Math.sin(a * 2) * .65, i % 2 === 0 ? pink : chrome, orbit);
                satellite.userData.destination = ["health","support","family","hardware","future","medical","handoff"][i];
                animated.push(satellite);
            }
            if (kind === "family") {
                const companion = ball(.4, .9, .7, .2, pink);
                companion.scale.set(1, 1.25, 1);
            }
            if (kind === "roadmap") {
                for (let i = 0; i < 3; i++) {
                    const r = ring(1.8 + i * .2, .018, glass);
                    r.rotation.x = 1.25;
                    r.position.y = -.8 - i * .15;
                }
            }
        }
        else {
            if (device === 0) {
                box(1.35, 1.4, .4, 0, -.1, 0, pearl);
                box(1.5, .48, .52, 0, -1.1, 0, dark);
                box(.68, .32, .57, 0, -1.1, .06, pink);
                for (let i = 0; i < 4; i++) {
                    const y = .85 + (i === 1 ? .08 : i === 3 ? -.16 : 0);
                    box(.28, 1.16 - i * .05, .32, -.51 + i * .34, y, 0, pearl);
                }
                box(.19, .22, .36, -.17, 1.62, .06, glow);
                const thumb = box(.37, .86, .34, -.92, -.05, 0, pearl);
                thumb.rotation.z = -.55;
                const lens = ball(.09, 0, -1.08, .37, glow);
                components.push({ mesh: lens, base: lens.position.clone(), offset: new THREE.Vector3(0, -.5, .5) });
            }
            if (device === 1) {
                for (const x of [-.82, .82]) {
                    const outline = new THREE.Shape();
                    outline.moveTo(-.59,-.455);outline.lineTo(.59,-.455);outline.quadraticCurveTo(.72,-.455,.72,-.32);outline.lineTo(.72,.32);outline.quadraticCurveTo(.72,.455,.59,.455);outline.lineTo(-.59,.455);outline.quadraticCurveTo(-.72,.455,-.72,.32);outline.lineTo(-.72,-.32);outline.quadraticCurveTo(-.72,-.455,-.59,-.455);
                    const hole=new THREE.Path();hole.moveTo(-.59,-.34);hole.lineTo(-.59,.34);hole.lineTo(.59,.34);hole.lineTo(.59,-.34);hole.closePath();outline.holes.push(hole);
                    const frame=mesh(new THREE.ExtrudeGeometry(outline,{depth:.08,bevelEnabled:true,bevelThickness:.02,bevelSize:.018,bevelSegments:3,curveSegments:12}),pink);frame.position.set(x,0,-.04);components.push({mesh:frame,base:frame.position.clone(),offset:new THREE.Vector3(x*.25,0,0)});
                    box(1.26, .72, .16, x, 0, .07, glass);
                    box(.13, .17, 1.9, x * 1.86, .13, -.82, dark);
                }
                box(.24, .1, .17, 0, .15, 0, pink);
                box(.26, .31, .55, 1.56, .12, -1.1, pink);
                const hud = box(.58, .025, .02, .83, .06, .18, glow);
                hud.rotation.z = .02;
            }
            if (device === 2) {
                box(3.3, .42, .12, 0, 0, -.17, dark);
                box(1.36, .94, .35, 0, 0, 0, pearl);
                box(.68, .39, .06, 0, .05, .21, dark);
                const trace = new THREE.CatmullRomCurve3([[-.27, .05], [-.17, .05], [-.12, -.02], [-.08, .17], [-.02, -.07], [.04, .05], [.27, .05]].map(([x, y]) => new THREE.Vector3(x, y, .253)));
                mesh(new THREE.TubeGeometry(trace, 35, .008, 6, false), glow);
                for (const [x, y] of [[-.9, -.9], [.9, -.9], [0, .96]]) {
                    const e = mesh(new THREE.CylinderGeometry(.22, .22, .08, 40), chrome);
                    e.rotation.x = Math.PI / 2;
                    e.position.set(x, y, .05);
                    components.push({ mesh: e, base: e.position.clone(), offset: new THREE.Vector3(x * .45, y * .5, .3) });
                    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0, 0), new THREE.Vector3(x * .4, y * .6, .02), new THREE.Vector3(x, y, 0)]);
                    mesh(new THREE.TubeGeometry(curve, 20, .022, 8, false), pink);
                }
            }
            if (device === 3) {
                box(2.95, .46, .64, 0, -.3, 0, chrome);
                box(.37, 1.35, .8, -1.4, 0, 0, dark);
                box(.37, 1.35, .8, 1.4, 0, 0, dark);
                box(1.2, .4, .55, 0, .1, 0, pink);
                box(.74, .42, .7, 0, .63, 0, pearl);
                box(.35, .13, .03, 0, .65, .38, glow);
                for (const x of [-1.4, 1.4]) {
                    const bolt = mesh(new THREE.CylinderGeometry(.13, .13, .2, 24), chrome);
                    bolt.rotation.x = Math.PI / 2;
                    bolt.position.set(x, .38, .45);
                }
            }
            if(device===4){box(.8,1.35,.65,0,.4,0,pearl);box(.65,.22,.55,0,-.38,0,chrome);box(2.1,.24,1.1,0,-.95,0,dark);box(.65,.5,.22,0,.5,.38,pink);const probe=ball(.18,0,-.48,0,glow);components.push({mesh:probe,base:probe.position.clone(),offset:new THREE.Vector3(0,-.3,0)});}
            if(device===5){box(1.7,1.05,.65,0,0,0,pearl);box(.7,.4,.05,-.28,.13,.35,dark);box(.75,.18,.8,.44,-.15,.68,pink);box(.5,.06,.45,.44,-.04,.78,glass);box(.15,.1,.15,.45,-.03,1.15,glow);}
            root.rotation.set(-.13, -.3, 0);
            const grid = new THREE.GridHelper(7, 20, 0xb68ed0, 0x634b78);
            grid.position.y = -2;
            const gm = grid.material as THREE.Material;
            gm.transparent = true;
            gm.opacity = .13;
            scene.add(grid);
        }
        components.forEach((c,i)=>{const map=[[2,1,1,2,2,2,2,0,2,0],[0,0,1,0,0,1,2,1,0],[2,0,0,1,1,1],[0,2,2,0,1,1],[0,0,2,1,0],[1,1,0,0,2]][device];c.mesh.userData.destination=`part:${map[i] ?? 0}`;});
        const dotsGeometry = new THREE.BufferGeometry();
        const positions = [];
        for (let i = 0; i < 45; i++) {
            positions.push(Math.sin(i * 12.98) * 3.5, Math.cos(i * 7.31) * 2.5, -2 - Math.abs(Math.sin(i * 3.4)) * 2);
        }
        dotsGeometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
        const dots = new THREE.Points(dotsGeometry, new THREE.PointsMaterial({ color: 0xecc4e3, size: .025, transparent: true, opacity: .65 }));
        scene.add(dots);
        const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
        let motionTime = 0;
        let visible = true, dragging = false, lastX = 0, yaw = 0, targetX = 0, targetY = 0, frame = 0, lastTime = 0, explodeAmount = 0;
        const resize = () => { const w = element.clientWidth, h = element.clientHeight; if (w && h) {
            renderer.setSize(w, h);
            camera.aspect = w / h;
            camera.updateProjectionMatrix();
        } };
        const observer = new ResizeObserver(resize);
        observer.observe(element);
        const intersection = new IntersectionObserver(([e]) => visible = e.isIntersecting);
        intersection.observe(element);
        resize();
        const raycaster = new THREE.Raycaster(); const pointer = new THREE.Vector2();
        let startX=0,startY=0;
        const hit = (e: PointerEvent) => {const b=element.getBoundingClientRect();pointer.set((e.clientX-b.left)/b.width*2-1,-(e.clientY-b.top)/b.height*2+1);raycaster.setFromCamera(pointer,camera);return raycaster.intersectObjects(root.children,true).find(h=>h.object.userData.destination)?.object.userData.destination as string|undefined;};
        const down = (e: PointerEvent) => { dragging = true; startX=e.clientX; startY=e.clientY; lastX = e.clientX; element.setPointerCapture(e.pointerId); };
        const move = (e: PointerEvent) => { if (dragging) {
            yaw += (e.clientX - lastX) * .008;
            lastX = e.clientX;
        } element.style.cursor=select.current && hit(e)?"pointer":"grab"; const b = element.getBoundingClientRect(); targetX = ((e.clientX - b.left) / b.width - .5) * .3; targetY = ((e.clientY - b.top) / b.height - .5) * .2; };
        const up = (e: PointerEvent) => { if(dragging && e.type!=="pointercancel" && Math.hypot(e.clientX-startX,e.clientY-startY)<6){const d=hit(e);if(d)select.current?.(d);} dragging=false; };
        const leave = () => { targetX = 0; targetY = 0; };
        const keypress = (e: KeyboardEvent) => { if(e.key==="Enter" && select.current){e.preventDefault();select.current(kind==="hardware"?"part:0":"health");} if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
            e.preventDefault();
            yaw += e.key === "ArrowLeft" ? -.2 : .2;
        } };
        const loss = (e: Event) => { e.preventDefault(); visible=false; renderer.domElement.style.display="none"; setFailed(true); };
        element.addEventListener("pointerdown", down);
        element.addEventListener("pointermove", move);
        element.addEventListener("pointerup", up);
        element.addEventListener("pointercancel", up);
        element.addEventListener("pointerleave", leave);
        element.addEventListener("keydown", keypress);
        renderer.domElement.addEventListener("webglcontextlost", loss);
        const render = (time: number) => { frame = requestAnimationFrame(render); if (!visible || document.hidden || time - lastTime < 33)
            return; lastTime = time; if (control.current.spin && !reduced.matches)
            motionTime += .033; const t = motionTime; if (control.current.spin && !reduced.matches && !dragging)
            yaw += kind === "hardware" ? .004 : .002; root.rotation.y += ((yaw + targetX) - root.rotation.y) * .05; if (kind !== "hardware") {
            root.rotation.x += (targetY - root.rotation.x) * .05;
            root.position.y = reduced.matches ? 0 : Math.sin(t * .6) * .09;
            orbit.rotation.z = reduced.matches ? 0 : Math.sin(t * .2) * .08;
        } explodeAmount += ((control.current.exploded ? 1 : 0) - explodeAmount) * .075; components.forEach(({ mesh, base, offset }) => mesh.position.copy(base).addScaledVector(offset, explodeAmount * gapValue(kind))); renderer.render(scene, camera); };
        frame = requestAnimationFrame(render);
        return () => { cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); element.removeEventListener("pointerdown", down); element.removeEventListener("pointermove", move); element.removeEventListener("pointerup", up); element.removeEventListener("pointercancel", up); element.removeEventListener("pointerleave", leave); element.removeEventListener("keydown", keypress); renderer.domElement.removeEventListener("webglcontextlost", loss); const geometries = new Set<THREE.BufferGeometry>(), materials = new Set<THREE.Material>(); scene.traverse(o => { if (o instanceof THREE.Mesh || o instanceof THREE.Points || o instanceof THREE.LineSegments) {
            geometries.add(o.geometry);
            for (const m of Array.isArray(o.material) ? o.material : [o.material])
                materials.add(m);
        } }); geometries.forEach(g => g.dispose()); [pearl, pink, chrome, glass, dark, glow].forEach(m => materials.add(m)); materials.forEach(m => m.dispose()); environment.dispose(); renderer.dispose(); renderer.domElement.remove(); };
    }, [kind, device, domain]);
    return <div className={`space-material ${className} ${failed ? "webgl-fallback" : ""}`} ref={host} tabIndex={kind === "domain" ? -1 : 0} role={onSelect?"button":"img"} aria-label={kind === "domain" ? ["Pearlescent heart","Immune cell sculpture","Bone sculpture","Brain sculpture","Crescent moon","Hydration droplet","Radiation orbit","Lung sculpture","Eye sculpture","Care cross"][domain] : kind === "hardware" ? `Interactive 3D ${["bioglove", "bioglass", "ECG wearable", "exercise sensor", "bone-scan attachment", "pocket biomarker reader"][device]} concept. Click a component to inspect it. Drag or use arrow keys to rotate.` : `Pearlescent HALO sculpture with lavender and pink orbital rings. ${onSelect ? "Click the core to open health. " : ""}Drag or use arrow keys to rotate.`}><div className="material-fallback"><i /><span /><b /></div>{failed && <small className="material-unavailable">3D unavailable · static material preview</small>}</div>;
}
function gapValue(kind: string) { return kind === "hardware" ? 1.6 : 0; }
