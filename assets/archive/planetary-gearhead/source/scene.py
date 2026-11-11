"""Studio product renders of the CF-104 planetary gearhead (CadQuery STLs) with Cycles.
usage: python scene.py <shot> <out.png> [samples] [scale%]
shots: hero, macro, explode
"""
import bpy, bmesh, json, math, os, sys
from mathutils import Vector, Matrix, Euler

HERE = os.path.dirname(os.path.abspath(__file__))
PARTS = os.path.join(HERE, "..", "cqw", "parts")
shot = sys.argv[1]
out = sys.argv[2]
samples = int(sys.argv[3]) if len(sys.argv) > 3 else 256
scale = int(sys.argv[4]) if len(sys.argv) > 4 else 100
OPT = dict(a.split("=") for a in sys.argv[5:] if "=" in a)
def opt(k, d):
    return type(d)(OPT.get(k, d))

bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene

# ------------------------------------------------------------ render setup
sc.render.engine = "CYCLES"
prefs = bpy.context.preferences.addons["cycles"].preferences
dev = os.environ.get("CYCLES_DEVICE", "METAL")
if dev != "CPU":
    prefs.compute_device_type = dev
    prefs.get_devices()
    for d in prefs.devices:
        d.use = True
    sc.cycles.device = "GPU"
else:
    sc.cycles.device = "CPU"
sc.cycles.samples = samples
sc.cycles.use_adaptive_sampling = True
sc.cycles.adaptive_threshold = 0.006
sc.cycles.use_denoising = True
sc.cycles.denoiser = "OPENIMAGEDENOISE"
try:
    sc.cycles.denoising_prefilter = "ACCURATE"
    sc.cycles.denoising_quality = "HIGH"
except Exception:
    pass
sc.cycles.max_bounces = 12
sc.cycles.glossy_bounces = 8
sc.cycles.transmission_bounces = 4
sc.cycles.caustics_reflective = False
sc.cycles.caustics_refractive = False
sc.cycles.blur_glossy = 0.5
sc.cycles.film_exposure = 1.0
sc.view_settings.exposure = opt("exp", 0.0)
sc.render.film_transparent = False
sc.render.filter_size = 1.2
sc.view_settings.view_transform = "AgX"
sc.view_settings.look = opt("look", "AgX - Medium High Contrast")

sc.view_settings.gamma = 1.0
sc.display_settings.display_device = "sRGB"
W, H = (1600, 1200) if shot == "hero" else (1920, 1080)
sc.render.resolution_x, sc.render.resolution_y = W, H
sc.render.resolution_percentage = scale
sc.render.image_settings.file_format = "PNG"
sc.render.image_settings.color_depth = "8"
sc.render.dither_intensity = 1.0


# ------------------------------------------------------------ materials
def principled(name):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    return m, nt, b


def link(nt, a, b):
    nt.links.new(a, b)


def radial_tangent(nt):
    t = nt.nodes.new("ShaderNodeTangent")
    t.direction_type = "RADIAL"
    t.axis = "Z"
    return t.outputs["Tangent"]


def micro_bump(nt, scale_, strength, detail=4.0, dist=0.00002):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale_
    n.inputs["Detail"].default_value = detail
    n.inputs["Roughness"].default_value = 0.6
    link(nt, tc.outputs["Object"], n.inputs["Vector"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = strength
    bp.inputs["Distance"].default_value = dist
    link(nt, n.outputs["Fac"], bp.inputs["Height"])
    return bp, n


def rough_var(nt, b, base, amp, scale_):
    tc = nt.nodes.new("ShaderNodeTexCoord")
    n = nt.nodes.new("ShaderNodeTexNoise")
    n.inputs["Scale"].default_value = scale_
    n.inputs["Detail"].default_value = 6
    link(nt, tc.outputs["Object"], n.inputs["Vector"])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["To Min"].default_value = base - amp
    mr.inputs["To Max"].default_value = base + amp
    link(nt, n.outputs["Fac"], mr.inputs["Value"])
    link(nt, mr.outputs["Result"], b.inputs["Roughness"])


MAT = {}


def mk_anodised():
    m, nt, b = principled("anodised")
    b.inputs["Base Color"].default_value = (0.012, 0.012, 0.013, 1)
    b.inputs["Metallic"].default_value = opt("an_metal", 0.2)
    rough_var(nt, b, opt("an_rough", 0.43), 0.05, 180)
    b.inputs["Specular IOR Level"].default_value = opt("an_spec", 0.4)
    b.inputs["Coat Weight"].default_value = opt("an_coat", 0.15)
    b.inputs["Coat Roughness"].default_value = 0.22
    b.inputs["Coat IOR"].default_value = 1.5
    bp, _ = micro_bump(nt, 9000, 0.08, dist=0.00001)  # bead-blast grain
    link(nt, bp.outputs["Normal"], b.inputs["Normal"])
    return m


def mk_metal(name, col, rough, aniso=0.0, bump=0.0, rv=0.03):
    m, nt, b = principled(name)
    b.inputs["Base Color"].default_value = (*col, 1)
    b.inputs["Metallic"].default_value = 1.0
    rough_var(nt, b, rough, rv, 300)
    if aniso:
        b.inputs["Anisotropic"].default_value = aniso
        link(nt, radial_tangent(nt), b.inputs["Tangent"])
    if bump:
        bp, _ = micro_bump(nt, 6000, bump, dist=0.00001)
        link(nt, bp.outputs["Normal"], b.inputs["Normal"])
    return m


def mk_rubber():
    m, nt, b = principled("rubber")
    b.inputs["Base Color"].default_value = (0.022, 0.022, 0.024, 1)
    b.inputs["Roughness"].default_value = 0.62
    b.inputs["Specular IOR Level"].default_value = 0.35
    bp, _ = micro_bump(nt, 4000, 0.15, dist=0.00001)
    link(nt, bp.outputs["Normal"], b.inputs["Normal"])
    return m


MAT["anodised"] = mk_anodised()
MAT["steel_ground"] = mk_metal("steel_ground", (0.56, 0.56, 0.57), 0.2, aniso=0.6)
MAT["steel_gear"] = mk_metal("steel_gear", (opt("gear", 0.36), opt("gear", 0.36), opt("gear", 0.36) * 1.03), opt("gr", 0.22), aniso=0.5, bump=0.04)
MAT["steel_dark"] = mk_metal("steel_dark", (0.35, 0.35, 0.36), 0.3, aniso=0.4)
MAT["steel_turned"] = mk_metal("steel_turned", (0.6, 0.6, 0.61), 0.17, aniso=0.75)
MAT["stainless"] = mk_metal("stainless", (0.62, 0.62, 0.63), 0.2, aniso=0.0, bump=0.03)
MAT["black_oxide"] = mk_metal("black_oxide", (0.045, 0.045, 0.05), 0.33)
MAT["brass"] = mk_metal("brass", (0.86, 0.62, 0.3), 0.27, aniso=0.3)
MAT["bronze"] = mk_metal("bronze", (0.78, 0.48, 0.27), 0.32, aniso=0.4)
MAT["rubber"] = mk_rubber()

# ------------------------------------------------------------ import meshes
spec = json.load(open(os.path.join(PARTS, "instances.json")))
MESH = {}


def load(name):
    if name in MESH:
        return MESH[name]
    bpy.ops.wm.stl_import(filepath=os.path.join(PARTS, name + ".stl"))
    ob = bpy.context.selected_objects[0]
    me = ob.data
    me.transform(Matrix.Scale(0.001, 4))
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-7)
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    me.set_sharp_from_angle(angle=math.radians(opt("smooth", 32.0)))
    me.materials.append(MAT[spec["mats"][name]])
    bpy.data.objects.remove(ob)
    me.name = name
    MESH[name] = me
    return me


def build_unit(tag, variant, loc, rot, explode=0.0, step=0.02):
    root = bpy.data.objects.new("unit_" + tag, None)
    sc.collection.objects.link(root)
    root.location = loc
    root.rotation_euler = rot
    for it in spec["inst"]:
        if variant == "open" and it["variant"] == "closed":
            continue
        me = load(it["part"])
        ob = bpy.data.objects.new(f"{tag}_{it['part']}", me)
        sc.collection.objects.link(ob)
        x, y, z = it["loc"]
        ez = explode * step * it["explode"]
        ob.location = (x * 0.001, y * 0.001, z * 0.001 + ez)
        ob.rotation_euler = (0, 0, math.radians(it["rotz"]))
        ob.parent = root
    return root


# ------------------------------------------------------------ studio
def cove(width=6.0, depth=6.0, R=0.8, height=4.0, albedo=0.6, y0=1.3):
    bm = bmesh.new()
    prof = [(-depth, 0.0)]
    for i in range(0, 41):
        a = math.radians(-90 + 90 * i / 40)
        prof.append((y0 - R + R * math.cos(a) + R - R, 0))  # placeholder
    prof = [(-depth, 0.0), (y0 - R, 0.0)]
    for i in range(1, 41):
        a = math.radians(-90 + 90 * i / 40)
        prof.append((y0 - R + R * math.cos(a) + 0 * a, R + R * math.sin(a)))
    prof.append((y0, height))
    rows = []
    for x in (-width / 2, width / 2):
        rows.append([bm.verts.new((x, -y if False else y, z)) for (y, z) in prof])
    for i in range(len(prof) - 1):
        bm.faces.new((rows[0][i], rows[1][i], rows[1][i + 1], rows[0][i + 1]))
    me = bpy.data.meshes.new("cove")
    bm.to_mesh(me)
    bm.free()
    me.shade_smooth()
    ob = bpy.data.objects.new("cove", me)
    sc.collection.objects.link(ob)
    m, nt, b = principled("backdrop")
    b.inputs["Base Color"].default_value = (albedo, albedo, albedo, 1)
    b.inputs["Roughness"].default_value = 0.85
    b.inputs["Specular IOR Level"].default_value = 0.2
    me.materials.append(m)
    return ob


def area(name, loc, target, size, power, shape="RECTANGLE", size_y=None, color=(1, 1, 1), spread=180):
    ld = bpy.data.lights.new(name, "AREA")
    ld.shape = shape
    ld.size = size
    if size_y:
        ld.size_y = size_y
    ld.energy = power
    ld.color = color
    ld.spread = math.radians(spread)
    ob = bpy.data.objects.new(name, ld)
    sc.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    return ob


def world(strength=0.35, col=(0.9, 0.92, 0.95)):
    w = bpy.data.worlds.new("w")
    sc.world = w
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    # gradient sky: brighter above, darker below -> nicer reflections on black parts
    nt = w.node_tree
    tc = nt.nodes.new("ShaderNodeTexCoord")
    sep = nt.nodes.new("ShaderNodeSeparateXYZ")
    nt.links.new(tc.outputs["Generated"], sep.inputs[0])
    mr = nt.nodes.new("ShaderNodeMapRange")
    mr.inputs["From Min"].default_value = -0.2
    mr.inputs["From Max"].default_value = 0.8
    mr.inputs["To Min"].default_value = 0.25
    mr.inputs["To Max"].default_value = 1.0
    nt.links.new(sep.outputs["Z"], mr.inputs["Value"])
    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.inputs[1].default_value = strength
    nt.links.new(mr.outputs["Result"], mul.inputs[0])
    bg.inputs["Color"].default_value = (*col, 1)
    nt.links.new(mul.outputs[0], bg.inputs["Strength"])


def camera(loc, target, lens, fstop, focus_obj_pt, sensor=36):
    cd = bpy.data.cameras.new("cam")
    cd.lens = lens
    cd.sensor_width = sensor
    cd.dof.use_dof = fstop > 0
    if fstop > 0:
        cd.dof.aperture_fstop = fstop
        cd.dof.aperture_blades = 7
        cd.dof.aperture_rotation = math.radians(10)
    ob = bpy.data.objects.new("cam", cd)
    sc.collection.objects.link(ob)
    ob.location = loc
    d = Vector(target) - Vector(loc)
    ob.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()
    cd.dof.focus_distance = (Vector(focus_obj_pt) - Vector(loc)).length
    sc.camera = ob
    return ob


R = 0.052
AX = math.radians(90)   # rotate assembly axis (+Z) to point at -Y (toward camera)

if shot == "hero":
    cove(albedo=opt("bg", 0.75))
    world(opt("world", 0.3))
    yl, yr = opt("yl", 22.0), opt("yr", -28.0)
    sp = opt("sp", 0.072)
    L = build_unit("L", "open", (-sp, 0.0, R), (AX, 0, math.radians(yl)))
    Rr = build_unit("R", "closed", (sp, 0.035, R), (AX, 0, math.radians(yr)))
    tgt = (0.0, 0.01, 0.05)
    k = opt("key", 1.0)
    area("top", (0.0, 0.1, 0.8), (0, 0, 0.05), 2.0, opt("ptop", 9.0), size_y=1.4)
    area("key", (-0.6, -0.5, 0.42), tgt, 1.2, opt("pkey", 7.0), size_y=0.8)
    area("fill", (0.7, -0.55, 0.2), tgt, 1.2, opt("pfill", 2.5), size_y=0.8)
    area("rim", (0.45, 0.65, 0.3), tgt, 0.6, opt("prim", 3.0), size_y=0.3)
    area("rimL", (-0.5, 0.55, 0.22), tgt, 0.5, opt("priml", 2.5), size_y=0.25)
    bgl = area("bgl", (0.0, 0.7, 0.9), (0, 1.4, 0.2), 2.5, opt("pbg", 20.0), size_y=1.0)
    bgl.visible_glossy = False
    area("front", (0.05, -1.0, 0.75), tgt, 1.6, opt("pfront", 6.0), size_y=0.8)
    if opt("pshadow", 0.0) > 0:
        area("shadow", (opt("shx", 0.3), opt("shy", 0.45), opt("shz", 0.55)), (0, 0, 0.03), opt("shs", 0.3), opt("pshadow", 0.0))
    camera((opt("cx", 0.0), opt("cy", -0.62), opt("cz", 0.17)), (0.0, 0.0, opt("tz", 0.05)), opt("lens", 75.0), opt("f", 8.0),
           (-0.06, -0.03, 0.052))
elif shot == "macro":
    cove(albedo=opt("bg", 0.75))
    world(opt("world", 0.3))
    U = build_unit("R", OPT.get("var", "closed"), (0.0, 0.0, R), (AX, 0, math.radians(opt("yaw", -32.0))))
    tgt = (0.0, -0.04, 0.06)
    k = opt("key", 1.0)
    area("top", (0.0, 0.1, 0.8), (0, 0, 0.05), 2.0, opt("ptop", 8.0), size_y=1.4)
    area("key", (-0.6, -0.5, 0.42), tgt, 1.2, opt("pkey", 6.0), size_y=0.8)
    area("fill", (0.7, -0.55, 0.2), tgt, 1.2, opt("pfill", 2.5), size_y=0.8)
    area("rim", (0.45, 0.65, 0.3), tgt, 0.6, opt("prim", 1.5), size_y=0.3)
    bgl = area("bgl", (0.0, 0.7, 0.9), (0, 1.4, 0.2), 2.5, opt("pbg", 20.0), size_y=1.0)
    bgl.visible_glossy = False
    area("front", (-0.2, -1.0, 0.75), tgt, 1.6, opt("pfront", 8.0), size_y=0.8)
    U.matrix_world  # noqa
    bpy.context.view_layer.update()
    # focus on the screw at 12 o'clock-ish of the face
    camera((opt("cx", -0.13), opt("cy", -0.24), opt("cz", 0.13)), (opt("tx", 0.0), opt("ty", -0.05), opt("tz", 0.062)), opt("lens", 100.0), opt("f", 4.0),
           (opt("fx", 0.0), opt("fy", -0.055), opt("fz", 0.07)))
elif shot == "explode":
    cove(albedo=opt("bg", 0.75), y0=1.6)
    world(opt("world", 0.3))
    ex = opt("ex", 1.0)
    U = build_unit("X", "closed", (opt("ux", 0.10), opt("uy", 0.0), opt("uz", 0.16)),
                   (math.radians(opt("pitch", 100.0)), 0, math.radians(opt("yaw", -62.0))), explode=ex, step=0.001)
    tgt = (0.0, 0.0, 0.16)
    area("top", (0.0, 0.1, 1.0), tgt, 2.4, opt("ptop", 10.0), size_y=1.6)
    area("key", (-0.8, -0.7, 0.55), tgt, 1.4, opt("pkey", 8.0), size_y=0.9)
    area("fill", (0.9, -0.7, 0.25), tgt, 1.4, opt("pfill", 3.0), size_y=0.9)
    area("rim", (0.5, 0.8, 0.4), tgt, 0.8, opt("prim", 2.5), size_y=0.4)
    area("rimL", (-0.6, 0.7, 0.3), tgt, 0.6, opt("priml", 2.0), size_y=0.3)
    bgl = area("bgl", (0.0, 0.9, 1.1), (0, 1.7, 0.2), 3.0, opt("pbg", 30.0), size_y=1.4)
    bgl.visible_glossy = False
    area("front", (-0.1, -1.6, 0.9), tgt, 2.0, opt("pfront", 12.0), size_y=1.0)
    camera((opt("cx", 0.0), opt("cy", -0.9), opt("cz", 0.30)), (opt("tx", 0.0), 0.0, opt("tz", 0.16)), opt("lens", 60.0), opt("f", 5.6),
           (opt("fx", 0.0), opt("fy", 0.0), opt("fz", 0.16)))

if OPT.get("blend"):
    bpy.ops.wm.save_as_mainfile(filepath=OPT["blend"])
sc.render.filepath = out
if OPT.get("dry"):
    bpy.context.view_layer.update()
    for o in sc.objects:
        if o.type == "MESH" and "housing" in o.name:
            bb = [o.matrix_world @ Vector(c) for c in o.bound_box]
            print("BB", o.name, [round(min(v[i] for v in bb), 3) for i in range(3)], [round(max(v[i] for v in bb), 3) for i in range(3)])
    for o in sc.objects:
        if o.type != "MESH" or "housing" in o.name or "cove" in o.name:
            print("OBJ", o.name, o.type, [round(v, 3) for v in o.matrix_world.translation], [round(v, 3) for v in o.dimensions])
    sys.exit()
bpy.ops.render.render(write_still=True)
print("WROTE", out)
