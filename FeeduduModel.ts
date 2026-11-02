/**
 * FeeduduModel.ts — 肥嘟嘟 程序化 Three.js 工厂（纯 TypeScript）
 * --------------------------------------------------------------------------
 * 重建对象：一张黄色卡通袋鼠/狗形玩偶（坐姿、梨形大肚、两长圆耳——左竖右张、
 *          右耳更粗长、大蛋形光泽棕鼻、白眼球深棕瞳、无嘴、短臂抱肚、
 *          V 字前伸脚、右后香蕉粗尾、哑光略光泽黏土质感）。
 *
 * 设计原则（遵循 img2threejs v2 的 8 阶段方法论）：
 *   粗模  → 单个 Lathe 旋转体勾出梨形轮廓（头身融合、无脖颈、接缝藏背面）
 *   结构  → 挂载耳/鼻/眼/臂/脚/尾，确定层级与锚点（root→facing→group）
 *   形体  → 各部件按原图比例雕刻（长耳、蛋鼻、抱肚手臂、V 脚、香蕉尾）
 *   材质  → 黄色哑光主体 + 米白腹部（顶点色） + 棕色鼻 + 白眼深棕瞳
 *   表面  → 中等 roughness 的软胶/黏土质感（不塑料）
 *   光照  → 由宿主场景/渲染器设置（柔和三点光 + 半球环境）
 *   交互  → 暴露 setParams 供外部 GUI/旋转控制实时调参（含朝向/倾斜）
 *   优化  → 复用材质、合理分段、单一根 Group、便于导出/二次编辑
 *
 * 用法（经打包器，如 Vite / tsc）：
 *   import * as THREE from 'three';
 *   import { createFeeduduModel } from './FeeduduModel';
 *   const model = createFeeduduModel();
 *   scene.add(model.root);
 *
 * 注意：浏览器无法原生运行 .ts；零构建演示见同目录 index.html（与本品行为一致）。
 */
import * as THREE from 'three';

export type RGB = THREE.ColorRepresentation;

/** 可被交互面板实时调节的参数（二次编辑入口） */
export interface FeeduduParams {
  bellyBulge: number;   // 腹部隆起程度 0.80–1.40
  earSpread: number;    // 右耳张开系数 0.40–1.40
  noseSize: number;     // 鼻子缩放 0.60–1.50
  eyeSize: number;      // 眼睛缩放 0.60–1.50
  tailLift: number;     // 尾巴上翘系数 0.60–1.60
  bodyHue: number;      // 主体色相微调 -0.06–0.06
  lean: number;         // 身体倾斜（轴线左上→右下）-0.05–0.20
  facing: number;       // 朝向（3/4 视角转身角，负值=朝画面左）-1.2–0.4
}

export interface FeeduduModel {
  root: THREE.Group;    // 含倾斜(lean)
  facing: THREE.Group;  // 含朝向(facing)
  group: THREE.Group;   // 部件组
  params: FeeduduParams;
  /** 实时改参：仅重建/变换受影响的部件，避免整树重算 */
  setParams(p: Partial<FeeduduParams>): void;
  dispose(): void;
}

export const FEEDUDU_DEFAULTS: FeeduduParams = {
  bellyBulge: 1.0,
  earSpread: 1.0,
  noseSize: 1.0,
  eyeSize: 1.0,
  tailLift: 1.0,
  bodyHue: 0,
  lean: 0.04,
  facing: -0.30,
};

const YELLOW = new THREE.Color('#ffcf3a');
const CREAM = new THREE.Color('#ffe9a8');
const NOSE = new THREE.Color('#6b3a1f');
const PUPIL = new THREE.Color('#3a241a');
const WHITE = new THREE.Color('#ffffff');

/**
 * 阶段 1–2（粗模 + 结构）：梨形旋转体。
 * Lathe 绕 Y 轴旋转，轮廓点 [半径, 高度] 从底部圆头到头顶收口；
 * phiStart 把几何接缝旋转到背面，避免正面出现竖向折痕。
 */
function buildBodyGeometry(): THREE.LatheGeometry {
  const profile: Array<[number, number]> = [
    [0.02, -1.20], [0.55, -1.05], [0.95, -0.80], [1.20, -0.45], [1.24, -0.10],
    [1.14, 0.25], [0.96, 0.58], [0.82, 0.88], [0.72, 1.12], [0.52, 1.32],
    [0.22, 1.44], [0.00, 1.50],
  ];
  const points = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(points, 120, Math.PI * 1.5, Math.PI * 2);
  geo.computeVertexNormals();
  return geo;
}

/**
 * 阶段 4（材质）：在主体几何上写顶点色，实现“黄身 + 米白腹部”双色。
 * 腹部 = 前侧(z>0) 且 偏下(y 较小) 的大椭圆区域，用 smoothstep 做柔和过渡。
 */
function applyBellyVertexColors(geo: THREE.LatheGeometry, bellyBulge: number): void {
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    const z = pos.getZ(i);
    const lower = 1 - THREE.MathUtils.smoothstep(y, 0.10, 1.00);
    const front = THREE.MathUtils.smoothstep(z, -0.10, 0.95);
    const m = THREE.MathUtils.clamp(lower * front * bellyBulge, 0, 1);
    c.copy(YELLOW).lerp(CREAM, m * 0.9);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.attributes.color.needsUpdate = true;
}

/** 阶段 3 工具：沿曲线生成“根部粗、尖端细”的锥形管（香蕉尾） */
function taperedTube(
  curve: THREE.Curve<THREE.Vector3>,
  tubularSegments: number,
  rBase: number,
  rTip: number,
  radialSegments: number,
): THREE.BufferGeometry {
  const geo = new THREE.TubeGeometry(curve, tubularSegments, 1, radialSegments, false);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const center = new THREE.Vector3();
  for (let i = 0; i <= tubularSegments; i++) {
    const t = i / tubularSegments;
    curve.getPointAt(t, center);
    const r = rBase + (rTip - rBase) * t;
    for (let j = 0; j <= radialSegments; j++) {
      const idx = i * (radialSegments + 1) + j;
      v.fromBufferAttribute(pos, idx).sub(center).multiplyScalar(r).add(center);
      pos.setXYZ(idx, v.x, v.y, v.z);
    }
  }
  geo.computeVertexNormals();
  return geo;
}

/** 阶段 3 工具：把默认沿 +Y 的圆柱/胶囊摆放到 from→to 之间 */
function orientBetween(mesh: THREE.Mesh, from: THREE.Vector3, to: THREE.Vector3): void {
  const dir = new THREE.Vector3().subVectors(to, from);
  mesh.position.copy(from).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
}

export function createFeeduduModel(initial: Partial<FeeduduParams> = {}): FeeduduModel {
  const params: FeeduduParams = { ...FEEDUDU_DEFAULTS, ...initial };

  const root = new THREE.Group(); root.name = 'FeeduduRoot';
  const facing = new THREE.Group(); facing.name = 'Facing';
  const group = new THREE.Group(); group.name = 'Feedudu';
  root.add(facing); facing.add(group);

  // ---- 材质（阶段 4/5：哑光黏土） ----
  const bodyVertexMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.60, metalness: 0.0 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: YELLOW.clone(), roughness: 0.60, metalness: 0.0 });
  const noseMat = new THREE.MeshStandardMaterial({ color: NOSE.clone(), roughness: 0.30, metalness: 0.0 });
  const scleraMat = new THREE.MeshStandardMaterial({ color: WHITE.clone(), roughness: 0.28, metalness: 0.0 });
  const pupilMat = new THREE.MeshStandardMaterial({ color: PUPIL.clone(), roughness: 0.20, metalness: 0.0 });
  const shineMat = new THREE.MeshStandardMaterial({ color: WHITE.clone(), roughness: 0.05, metalness: 0.0 });

  // ---- 主体（阶段 1/2/4） ----
  const bodyGeo = buildBodyGeometry();
  applyBellyVertexColors(bodyGeo, params.bellyBulge);
  const body = new THREE.Mesh(bodyGeo, bodyVertexMat);
  body.name = 'body'; body.castShadow = true; body.receiveShadow = true;
  group.add(body);

  // ---- 耳朵（阶段 3：圆顶香肠长棒，左细竖直 / 右粗长张开） ----
  const earLGeo = new THREE.CapsuleGeometry(0.17, 0.90, 12, 20);
  const earRGeo = new THREE.CapsuleGeometry(0.21, 1.18, 12, 22);
  const earL = new THREE.Mesh(earLGeo, yellowMat); earL.name = 'ear_L';
  earL.position.set(-0.36, 1.45, -0.05); earL.castShadow = true; group.add(earL);
  const earR = new THREE.Mesh(earRGeo, yellowMat); earR.name = 'ear_R';
  earR.position.set(0.40, 1.46, -0.05); earR.castShadow = true; group.add(earR);

  // ---- 鼻子（阶段 3：大蛋形深棕、光泽、略前凸、略下倾） ----
  const noseGeo = new THREE.SphereGeometry(1, 32, 24); noseGeo.scale(0.24, 0.20, 0.18);
  const nose = new THREE.Mesh(noseGeo, noseMat);
  nose.name = 'nose'; nose.position.set(0.0, 0.82, 0.84); nose.rotation.x = 0.16;
  group.add(nose);

  // ---- 眼睛（阶段 3：白眼球 + 深棕瞳孔 + 左上高光；等大、对称分布于鼻上） ----
  const scleraGeo = new THREE.SphereGeometry(0.16, 28, 22); scleraGeo.scale(1.0, 1.12, 0.92);
  const pupilGeo = new THREE.SphereGeometry(0.090, 24, 18);
  const shineGeo = new THREE.SphereGeometry(0.034, 14, 10);
  const eyeDefs = [
    { x: -0.24, y: 1.08, z: 0.86 },
    { x: 0.24, y: 1.02, z: 0.86 },
  ];
  const eyes: THREE.Group[] = eyeDefs.map((d, i) => {
    const eg = new THREE.Group();
    const sc = new THREE.Mesh(scleraGeo, scleraMat);
    const pu = new THREE.Mesh(pupilGeo, pupilMat); pu.position.set(0, 0, 0.11);
    const sh = new THREE.Mesh(shineGeo, shineMat); sh.position.set(-0.035, 0.045, 0.18);
    eg.add(sc, pu, sh); eg.name = `eye_${i === 0 ? 'L' : 'R'}`;
    eg.position.set(d.x, d.y, d.z);
    group.add(eg); return eg;
  });

  // ---- 手臂（阶段 3：短粗，自两侧中上部伸出、肘外、手搭浅色肚子，露在身体之外） ----
  const armGeo = new THREE.CapsuleGeometry(0.17, 0.55, 8, 16);
  const pawGeo = new THREE.SphereGeometry(0.19, 18, 14);
  const arms: THREE.Group[] = [-1, 1].map((side) => {
    const ag = new THREE.Group(); ag.name = `arm_${side < 0 ? 'L' : 'R'}`;
    const shoulder = new THREE.Vector3(side * 0.80, 0.55, 0.85);
    const pawPos = new THREE.Vector3(side * 0.18, 0.15, 1.20);
    const arm = new THREE.Mesh(armGeo, yellowMat); orientBetween(arm, shoulder, pawPos);
    const paw = new THREE.Mesh(pawGeo, yellowMat); paw.position.copy(pawPos);
    ag.add(arm, paw); ag.castShadow = true;
    group.add(ag); return ag;
  });

  // ---- 脚（阶段 3：坐姿，两腿向前左右张开呈 V，短粗圆角靴形，脚尖外八） ----
  const footGeo = new THREE.SphereGeometry(1, 22, 16); footGeo.scale(0.34, 0.26, 0.52);
  const feet: THREE.Mesh[] = [-1, 1].map((side) => {
    const foot = new THREE.Mesh(footGeo, yellowMat);
    foot.name = `foot_${side < 0 ? 'L' : 'R'}`;
    foot.position.set(side * 0.54, -1.00, 0.80);
    foot.rotation.set(-0.35, -side * 0.32, side * 0.62);
    foot.castShadow = true;
    group.add(foot); return foot;
  });

  // ---- 尾巴（阶段 3：粗壮香蕉形，自右后方伸出、下弯后上翘，根部粗、尖端圆） ----
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.60, -0.55, -0.50),
    new THREE.Vector3(1.10, -0.60, -0.28),
    new THREE.Vector3(1.45, -0.15, 0.05),
    new THREE.Vector3(1.25, 0.45, 0.20),
  ]);
  const tailGeo = taperedTube(tailCurve, 72, 0.28, 0.12, 18);
  const tail = new THREE.Mesh(tailGeo, yellowMat);
  tail.name = 'tail'; tail.castShadow = true; group.add(tail);
  const tailTip = new THREE.Vector3(); tailCurve.getPointAt(1, tailTip);
  const tailCapGeo = new THREE.SphereGeometry(0.12, 18, 14);
  const tailCap = new THREE.Mesh(tailCapGeo, yellowMat);
  tailCap.position.copy(tailTip); tailCap.castShadow = true; group.add(tailCap);

  // ---- 姿态应用（阶段 3/6） ----
  function applyPose(): void {
    earL.rotation.set(0, 0, THREE.MathUtils.degToRad(20));
    earR.rotation.set(0, 0, -THREE.MathUtils.degToRad(60) * params.earSpread);
    earL.rotation.x = -0.15; earR.rotation.x = -0.15;
    nose.scale.setScalar(params.noseSize);
    eyes.forEach((e) => { e.scale.setScalar(params.eyeSize); e.rotation.y = -params.facing; });
    tail.scale.set(1, 1 + (params.tailLift - 1) * 0.2, 1);
    facing.rotation.y = params.facing;
    root.rotation.z = params.lean;
  }
  applyPose();

  const materials = [bodyVertexMat, yellowMat, noseMat, scleraMat, pupilMat, shineMat];
  const geometries = [bodyGeo, earLGeo, earRGeo, noseGeo, scleraGeo, pupilGeo, shineGeo, armGeo, pawGeo, footGeo, tailGeo, tailCapGeo];

  return {
    root, facing, group, params,
    setParams(p: Partial<FeeduduParams>): void {
      let needBodyRebuild = false;
      if (p.bellyBulge !== undefined) { params.bellyBulge = p.bellyBulge; needBodyRebuild = true; }
      if (p.earSpread !== undefined) params.earSpread = p.earSpread;
      if (p.noseSize !== undefined) params.noseSize = p.noseSize;
      if (p.eyeSize !== undefined) params.eyeSize = p.eyeSize;
      if (p.tailLift !== undefined) params.tailLift = p.tailLift;
      if (p.lean !== undefined) params.lean = p.lean;
      if (p.facing !== undefined) params.facing = p.facing;
      if (p.bodyHue !== undefined) {
        params.bodyHue = p.bodyHue;
        const hsl = { h: 0, s: 0, l: 0 };
        YELLOW.getHSL(hsl);
        yellowMat.color.setHSL((hsl.h + p.bodyHue + 1) % 1, hsl.s, hsl.l);
      }
      if (needBodyRebuild) applyBellyVertexColors(bodyGeo, params.bellyBulge);
      applyPose();
    },
    dispose(): void {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    },
  };
}

export default createFeeduduModel;
