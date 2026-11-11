"""CF-104 planetary gearhead, modelled in CadQuery (the language CADForge agents write).
Exports each unique part as a fine STL plus an instances.json describing the assembly.
Units: mm. Axis: +Z = output side.
"""
import json, math, os, sys
import cadquery as cq
from cadquery import exporters

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "parts")
os.makedirs(OUT, exist_ok=True)

M = 1.5           # module
ZS, ZP, ZR = 12, 21, 54
CD = (ZS + ZP) * M / 2.0   # 24.75 centre distance
R_OUT = 52.0      # housing / cover outer radius
R_INS = 46.5      # insert / screw bolt circle


class Pred(cq.Selector):
    def __init__(self, f):
        self.f = f

    def filter(self, objs):
        return [o for o in objs if self.f(o)]


def soften(wp, pred, r, kind="fillet"):
    """Fillet (or chamfer) every edge whose centre satisfies pred(x, y, z, rho)."""
    def ok(e):
        c = e.positionAt(0.5)
        return pred(c.x, c.y, c.z, math.hypot(c.x, c.y))
    try:
        sel = wp.edges(Pred(ok))
        n = sel.size()
        if n == 0:
            return wp
        res = sel.fillet(r) if kind == "fillet" else sel.chamfer(r)
        res.val().isValid()
        return res
    except Exception as ex:  # fall back to chamfer, then to nothing
        print("  soften failed", kind, r, ex, file=sys.stderr)
        if kind == "fillet":
            return soften(wp, pred, r * 0.8, "chamfer")
        return wp


def inv(a):
    return math.tan(a) - a


def gear_wire(z, m, ha=1.0, hf=1.25, phase=0.0, backlash=0.04, n=8):
    """Closed involute gear outline as a list of edges built on a Workplane."""
    pa = math.radians(20)
    rp = m * z / 2
    rb = rp * math.cos(pa)
    ra = rp + ha * m
    rf = rp - hf * m
    half = math.pi / (2 * z) - backlash / (2 * rp)

    def psi(r):
        r = max(r, rb)
        return half + inv(pa) - inv(math.acos(rb / r))

    r0 = max(rb, rf)
    rs = [r0 + (ra - r0) * (i / n) ** 1.0 for i in range(n + 1)]
    P = lambda r, a: (r * math.cos(a), r * math.sin(a))
    wp = None
    step = 2 * math.pi / z
    for k in range(z):
        c = phase + k * step
        right = [P(r, c - psi(r)) for r in rs]
        left = [P(r, c + psi(r)) for r in reversed(rs)]
        if wp is None:
            start = P(rf, c - psi(r0))
            wp = cq.Workplane("XY").moveTo(*start)
        if rf < r0 - 1e-6:
            wp = wp.lineTo(*right[0])
        wp = wp.spline(right[1:], includeCurrent=True)
        wp = wp.threePointArc(P(ra, c), left[0])
        wp = wp.spline(left[1:], includeCurrent=True)
        if rf < r0 - 1e-6:
            wp = wp.lineTo(*P(rf, c + psi(r0)))
        nxt = c + step
        a0 = c + psi(r0)
        a1 = nxt - psi(r0)
        if k == z - 1:
            wp = wp.threePointArc(P(rf, (a0 + a1) / 2), P(rf, a1))
            wp = wp.close()
        else:
            wp = wp.threePointArc(P(rf, (a0 + a1) / 2), P(rf, a1))
    return wp


def gear_solid(z, m, h, ha=1.0, hf=1.25, phase=0.0, chamfer=0.3):
    g = gear_wire(z, m, ha, hf, phase).extrude(h)
    if chamfer:
        g = soften(g, lambda x, y, zz, r: (abs(zz) < 1e-3 or abs(zz - h) < 1e-3) and r > m * z / 2 - 1.3 * m, chamfer, "chamfer")
    return g


def revolve(profile):
    """profile: list of (r, z) points, closed, revolved about Z."""
    return cq.Workplane("XZ").polyline(profile).close().revolve(360, (0, 0, 0), (0, 1, 0))


parts = {}
inst = []


def add(name, solid, material):
    parts[name] = (solid, material)


def place(part, loc=(0, 0, 0), rotz=0.0, rot=(0, 0, 0), group="", explode=0.0, variant="both"):
    inst.append(dict(part=part, loc=loc, rotz=rotz, rot=rot, group=group, explode=explode, variant=variant))


# ---------------------------------------------------------------- housing
def housing():
    h = cq.Workplane("XY").circle(R_OUT).extrude(42)
    # rear bore + gear bore
    h = h.cut(cq.Workplane("XY").workplane(offset=6).circle(39.0).extrude(40))
    ring_cut = gear_wire(ZR, M, ha=1.25, hf=1.07, phase=RING_PHASE).extrude(20).translate((0, 0, 18))
    h = h.cut(ring_cut)
    h = h.cut(cq.Workplane("XY").workplane(offset=38).circle(42.6).extrude(5))
    # rear: input bore + pilot recess
    h = h.cut(cq.Workplane("XY").workplane(offset=-1).circle(11).extrude(10))
    h = h.cut(cq.Workplane("XY").workplane(offset=-1).circle(22).extrude(3))
    # insert holes front
    pts = [(R_INS * math.cos(math.radians(a)), R_INS * math.sin(math.radians(a))) for a in range(0, 360, 60)]
    h = h.cut(cq.Workplane("XY").workplane(offset=34).pushPoints(pts).circle(2.5).extrude(9))
    # rear tapped holes
    pr = [(40 * math.cos(math.radians(a)), 40 * math.sin(math.radians(a))) for a in range(45, 360, 90)]
    h = h.cut(cq.Workplane("XY").workplane(offset=-1).pushPoints(pr).circle(1.7).extrude(9))
    # exterior flutes: 12 rounded axial pockets
    for i in range(12):
        a = math.radians(15 + 30 * i)
        cut = (cq.Workplane("YZ").workplane(offset=R_OUT - 1.4).center(0, 21)
               .slot2D(22, 9, 90).extrude(10))
        cut = soften(cut, lambda x, y, z, r: abs(x - (R_OUT - 1.4)) < 1e-3, 0.8)
        h = h.cut(cut.rotate((0, 0, 0), (0, 0, 1), math.degrees(a)))
    # circumferential grooves
    for zc in (3.0, 38.5):
        g = cq.Workplane("XY").workplane(offset=zc - 0.5).circle(R_OUT + 1).circle(R_OUT - 0.6).extrude(1.0)
        h = h.cut(g)
    # soften
    h = soften(h, lambda x, y, z, r: r > R_OUT - 0.05 and (abs(z) < 1e-3 or abs(z - 42) < 1e-3), 0.9)
    h = soften(h, lambda x, y, z, r: R_OUT - 2 < r < R_OUT + 0.1 and 8 < z < 34, 0.45)   # flute rims
    h = soften(h, lambda x, y, z, r: abs(z - 42) < 1e-3 and 42 < r < 43, 0.4)
    h = soften(h, lambda x, y, z, r: abs(z - 42) < 1e-3 and 44 < r < 49, 0.3, "chamfer")
    h = soften(h, lambda x, y, z, r: abs(z) < 1e-3 and r < 23, 0.4, "chamfer")
    h = soften(h, lambda x, y, z, r: abs(z - 38) < 1e-3 and r > 42 and r < 43, 0.3, "chamfer")
    h = soften(h, lambda x, y, z, r: R_OUT - 0.7 < r < R_OUT + 0.1 and (2 < z < 4 or 37.5 < z < 39.5), 0.2, "chamfer")
    return h


# ---------------------------------------------------------------- carrier
def carrier():
    c = cq.Workplane("XY").workplane(offset=10).circle(37.5).extrude(7)
    c = c.union(cq.Workplane("XY").workplane(offset=6.5).circle(13).extrude(4))
    c = c.cut(cq.Workplane("XY").circle(5.5).extrude(30))
    pins = [(CD * math.cos(math.radians(a)), CD * math.sin(math.radians(a))) for a in (90, 210, 330)]
    c = c.cut(cq.Workplane("XY").workplane(offset=9).pushPoints(pins).circle(4).extrude(10))
    lh = [(26 * math.cos(math.radians(a)), 26 * math.sin(math.radians(a))) for a in (30, 150, 270)]
    c = c.cut(cq.Workplane("XY").workplane(offset=9).pushPoints(lh).circle(6.5).extrude(10))
    sm = [(31 * math.cos(math.radians(a)), 31 * math.sin(math.radians(a))) for a in (90, 210, 330)]
    c = c.cut(cq.Workplane("XY").workplane(offset=16).pushPoints(sm).circle(1.6).extrude(2))
    c = soften(c, lambda x, y, z, r: abs(z - 17) < 1e-3 and r > 37, 0.6)
    c = soften(c, lambda x, y, z, r: abs(z - 17) < 1e-3 and r < 33 and abs(r - 31 - 1.6) > 0.3 and abs(r - 31 + 1.6) > 0.3, 0.4, "chamfer")
    c = soften(c, lambda x, y, z, r: abs(z - 10) < 1e-3 and r > 30, 0.5)
    c = soften(c, lambda x, y, z, r: abs(z - 6.5) < 1e-3, 0.4, "chamfer")
    return c


def pin():
    p = cq.Workplane("XY").circle(4).extrude(27).translate((0, 0, 9))
    p = p.cut(cq.Workplane("XY").workplane(offset=33.6).circle(5).circle(3.6).extrude(0.7))
    p = soften(p, lambda x, y, z, r: abs(z - 36) < 1e-3, 0.6, "chamfer")
    p = soften(p, lambda x, y, z, r: abs(z - 9) < 1e-3, 0.4, "chamfer")
    return p


def planet():
    g = gear_solid(ZP, M, 12).translate((0, 0, 21))
    g = g.cut(cq.Workplane("XY").workplane(offset=20).circle(6.5).extrude(14))
    # hub relief
    g = g.cut(cq.Workplane("XY").workplane(offset=32.2).circle(11).circle(8).extrude(2))
    g = g.cut(cq.Workplane("XY").workplane(offset=20.2).circle(11).circle(8).extrude(-2))
    g = soften(g, lambda x, y, z, r: r < 11.2 and (abs(z - 33) < 1e-3 or abs(z - 21) < 1e-3 or abs(z - 32.2) < 1e-3 or abs(z - 21.8) < 1e-3), 0.25, "chamfer")
    return g


def needle():
    n = cq.Workplane("XY").circle(6.5).circle(4).extrude(11).translate((0, 0, 21.5))
    n = soften(n, lambda x, y, z, r: True, 0.3, "chamfer")
    return n


def washer():
    w = cq.Workplane("XY").circle(7.8).circle(4.1).extrude(0.8).translate((0, 0, 33.05))
    w = soften(w, lambda x, y, z, r: r > 7, 0.2)
    return w


def eclip():
    # E-clip on pin groove
    c = cq.Workplane("XY").circle(6.2).circle(3.6).extrude(0.7).translate((0, 0, 33.6))
    c = c.cut(cq.Workplane("XY").center(5, 0).rect(10, 5.2).extrude(40))
    for a in (-60, 60):
        c = c.cut(cq.Workplane("XY").center(5.2 * math.cos(math.radians(180 + a)), 5.2 * math.sin(math.radians(180 + a))).circle(0.9).extrude(40))
    c = soften(c, lambda x, y, z, r: True, 0.12, "chamfer")
    return c


def sun():
    g = gear_solid(ZS, M, 13, phase=0.0).translate((0, 0, 20.5))
    shaft = cq.Workplane("XY").circle(5.5).extrude(26).translate((0, 0, -4))
    g = g.union(shaft)
    g = g.cut(cq.Workplane("XY").workplane(offset=33.5).polygon(6, 3.0 / math.cos(math.pi / 6)).extrude(-3))
    g = g.cut(cq.Workplane("XY").workplane(offset=-4).rect(20, 20).extrude(1.0).translate((0, 4.5 + 10 - 0.0, 0)))  # flat start
    g = soften(g, lambda x, y, z, r: abs(z + 4) < 1e-3, 0.5, "chamfer")
    g = soften(g, lambda x, y, z, r: abs(z - 33.5) < 1e-3 and r < 3, 0.2, "chamfer")
    return g


# ---------------------------------------------------------------- inserts and fasteners
def insert():
    i = cq.Workplane("XY").circle(2.5).circle(1.35).extrude(8).translate((0, 0, 34))
    i = soften(i, lambda x, y, z, r: abs(z - 42) < 1e-3, 0.25, "chamfer")
    return i


def shcs(L=10.0, d=3.0, dk=5.5, k=3.0, s=2.5):
    head = cq.Workplane("XY").circle(dk / 2).extrude(k)
    head = soften(head, lambda x, y, z, r: abs(z - k) < 1e-3, 0.45)
    head = soften(head, lambda x, y, z, r: abs(z) < 1e-3, 0.2, "chamfer")
    sock = cq.Workplane("XY").workplane(offset=k).polygon(6, s / math.cos(math.pi / 6)).extrude(-1.7)
    cone = cq.Solid.makeCone(s / 2 * 1.1, 0.01, 0.7, cq.Vector(0, 0, k - 1.7), cq.Vector(0, 0, -1))
    head = head.cut(sock).cut(cq.Workplane().add(cone))
    head = soften(head, lambda x, y, z, r: abs(z - k) < 1e-3 and r < s, 0.15, "chamfer")
    shank = cq.Workplane("XY").circle(d / 2).extrude(-L)
    shank = soften(shank, lambda x, y, z, r: abs(z + L) < 1e-3, 0.3, "chamfer")
    return head.union(shank)


# ---------------------------------------------------------------- cover
def cover():
    c = cq.Workplane("XY").workplane(offset=42).circle(R_OUT).extrude(8)
    c = c.union(cq.Workplane("XY").workplane(offset=39).circle(42.4).extrude(3.5))
    c = c.union(cq.Workplane("XY").workplane(offset=49).circle(25).extrude(5))
    # bearing bore, circlip groove
    c = c.cut(cq.Workplane("XY").workplane(offset=38).circle(15.5).extrude(20))
    c = c.cut(cq.Workplane("XY").workplane(offset=45.2).circle(18.5).extrude(10))
    c = c.cut(cq.Workplane("XY").workplane(offset=52.3).circle(19.9).extrude(0.85))
    # counterbores
    pts = [(R_INS * math.cos(math.radians(a)), R_INS * math.sin(math.radians(a))) for a in range(0, 360, 60)]
    c = c.cut(cq.Workplane("XY").workplane(offset=38).pushPoints(pts).circle(1.7).extrude(15))
    c = c.cut(cq.Workplane("XY").workplane(offset=46.8).pushPoints(pts).circle(3.15).extrude(5))
    # kidney pockets between screws
    for i in range(6):
        a0 = math.radians(30 + 60 * i - 19)
        a1 = math.radians(30 + 60 * i + 19)
        am = (a0 + a1) / 2
        r1, r2 = 29.5, 41.0
        P = lambda r, a: (r * math.cos(a), r * math.sin(a))
        w = (cq.Workplane("XY").workplane(offset=47.0).moveTo(*P(r1, a0)).lineTo(*P(r2, a0))
             .threePointArc(P(r2, am), P(r2, a1)).lineTo(*P(r1, a1)).threePointArc(P(r1, am), P(r1, a0)).close()
             .extrude(5))
        w = soften(w, lambda x, y, z, r: 47.5 < z < 51.5, 3.0)  # vertical corners
        w = soften(w, lambda x, y, z, r: abs(z - 47.0) < 1e-3, 1.2)  # floor fillet
        c = c.cut(w)
    c = soften(c, lambda x, y, z, r: abs(z - 50) < 1e-3 and 28 < r < 42.5, 0.45)   # pocket rims
    c = soften(c, lambda x, y, z, r: abs(z - 50) < 1e-3 and r > R_OUT - 0.1, 1.0)
    c = soften(c, lambda x, y, z, r: abs(z - 54) < 1e-3 and r > 24.9, 0.6)
    c = soften(c, lambda x, y, z, r: abs(z - 50) < 1e-3 and 24.9 < r < 25.5, 0.8)  # boss root
    c = soften(c, lambda x, y, z, r: abs(z - 54) < 1e-3 and r < 18.6, 0.3, "chamfer")
    c = soften(c, lambda x, y, z, r: abs(z - 50) < 1e-3 and 43 < r < 50, 0.25, "chamfer")  # cb rims
    c = soften(c, lambda x, y, z, r: abs(z - 42) < 1e-3 and r > R_OUT - 0.1, 0.4, "chamfer")
    c = soften(c, lambda x, y, z, r: abs(z - 39) < 1e-3, 0.5, "chamfer")
    # laser-etched style graduation ring on the boss face
    ticks = None
    for i in range(72):
        L = 2.0 if i % 6 == 0 else 1.1
        t = cq.Workplane("XY").workplane(offset=54 - 0.18).center(21.0 + L / 2, 0).rect(L, 0.28).extrude(1)
        t = t.rotate((0, 0, 0), (0, 0, 1), i * 5)
        ticks = t if ticks is None else ticks.union(t)
    c = c.cut(ticks)
    # engraved markings in the pocket floors
    for txt, y, h in (("CADFORGE", -35.6, 2.7), ("CF-104  i=5.5", 35.6, 2.2)):
        tx = cq.Workplane("XY").workplane(offset=47.0).center(0, y).text(txt, h, -0.22, font="Helvetica Neue", kind="bold", combine=False)
        c = c.cut(tx.translate((0, 0, 0)))
    return c


def bearing_outer():
    return revolve([(16.0, 45.2), (18.5, 45.2), (18.5, 52.2), (16.0, 52.2)]).edges().fillet(0.3)


def bearing_inner():
    return revolve([(12.5, 45.2), (14.6, 45.2), (14.6, 52.2), (12.5, 52.2)]).edges().fillet(0.3)


def bearing_seal():
    s = revolve([(14.6, 45.6), (16.0, 45.6), (16.0, 51.8), (14.6, 51.8)])
    # concentric ridges on front
    for rr in (15.0, 15.6):
        s = s.cut(cq.Workplane("XY").workplane(offset=51.8).circle(rr + 0.12).circle(rr - 0.12).extrude(-0.15))
    return s


def circlip():
    c = cq.Workplane("XY").workplane(offset=52.35).circle(19.85).circle(17.2).extrude(0.75)
    # gap with lugs
    c = c.cut(cq.Workplane("XY").center(0, 19).rect(4.0, 6).extrude(80))
    for sx in (-1, 1):
        lug = cq.Workplane("XY").workplane(offset=52.35).center(sx * 3.6, 16.6).circle(1.9).extrude(0.75)
        c = c.union(lug)
        c = c.cut(cq.Workplane("XY").center(sx * 3.6, 16.6).circle(0.75).extrude(80))
    c = c.cut(cq.Workplane("XY").workplane(offset=52.35).circle(14.6).extrude(1))
    c = soften(c, lambda x, y, z, r: abs(z - 53.1) < 1e-3, 0.15, "chamfer")
    return c


def dowel():
    d = cq.Workplane("XY").workplane(offset=55).center(0, -8).circle(1.5).extrude(5.6)
    return soften(d, lambda x, y, z, r: abs(z - 60.6) < 1e-3, 0.35, "chamfer")


def output_shaft():
    s = revolve([(0, 40), (14.2, 40), (14.2, 45.2), (12.5, 45.2), (12.5, 59), (0, 59)])
    s = s.cut(cq.Workplane("XY").workplane(offset=59).circle(3).extrude(-8))
    pts = [(8 * math.cos(math.radians(a)), 8 * math.sin(math.radians(a))) for a in range(45, 360, 90)]
    s = s.cut(cq.Workplane("XY").workplane(offset=59).pushPoints(pts).circle(1.25).extrude(-6))
    s = s.cut(cq.Workplane("XY").workplane(offset=59).center(0, -8).circle(1.5).extrude(-5))
    s = soften(s, lambda x, y, z, r: abs(z - 59) < 1e-3 and r > 12, 0.8, "chamfer")
    s = soften(s, lambda x, y, z, r: abs(z - 59) < 1e-3 and r < 9.9, 0.2, "chamfer")
    s = soften(s, lambda x, y, z, r: abs(z - 40) < 1e-3, 0.5, "chamfer")
    # thread crests inside the tapped holes (stacked V-rings read as an M2.5 thread)
    ring = revolve([(1.2, -0.2), (1.52, 0.0), (1.2, 0.2)])
    tool = None
    for (px, py) in pts:
        for k in range(10):
            rr = ring.translate((px, py, 58.3 - 0.45 * k))
            tool = rr if tool is None else tool.union(rr)
    s = s.cut(tool)
    return s


# ---------------------------------------------------------------- phasing
def planet_phase(theta):
    # sun tooth at angle 0. Planet must present a gap toward the sun.
    return theta * (1 + ZS / ZP) + math.pi / ZP * (ZP % 2 == 0)


RING_PHASE = float(os.environ.get("RING_PHASE", str(math.pi / ZR)))


def check_mesh():
    s = gear_solid(ZS, M, 5, chamfer=0)
    best = None
    for sign in (1, -1):
        for off in (0.0, math.pi / ZP):
            tot = 0
            for th in (math.radians(90), math.radians(210)):
                ph = sign * th * (1 + ZS / ZP) + off
                p = gear_solid(ZP, M, 5, phase=ph + th * 0, chamfer=0).translate((CD * math.cos(th), CD * math.sin(th), 0))
                tot += s.intersect(p).val().Volume() if True else 0
            print("sun mesh", sign, off, tot)
            if best is None or tot < best[0]:
                best = (tot, sign, off)
    return best


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "export"
    if mode == "check":
        print(check_mesh())
        sys.exit()
    if mode == "ring":
        for rp in (0.0, math.pi / ZR):
            ring = cq.Workplane("XY").circle(44).circle(37).extrude(5).cut(gear_wire(ZR, M, ha=1.25, hf=1.0, phase=rp).extrude(5))
            tot = 0
            for th in (math.radians(90), math.radians(210), math.radians(330)):
                p = gear_solid(ZP, M, 5, chamfer=0).rotate((0, 0, 0), (0, 0, 1), math.degrees(planet_phase(th))).translate((CD * math.cos(th), CD * math.sin(th), 0))
                tot += ring.intersect(p).val().Volume()
            print("ring", rp, tot)
        sys.exit()

    only = sys.argv[2:] if len(sys.argv) > 2 else None
    builders = dict(housing=(housing, "anodised"), carrier=(carrier, "anodised"), pin=(pin, "steel_ground"),
                    planet=(planet, "steel_gear"), needle=(needle, "steel_dark"), washer=(washer, "bronze"),
                    eclip=(eclip, "black_oxide"), sun=(sun, "steel_gear"), insert=(insert, "brass"),
                    shcs=(shcs, "stainless"), cover=(cover, "anodised"), bearing_outer=(bearing_outer, "steel_ground"),
                    bearing_inner=(bearing_inner, "steel_ground"), bearing_seal=(bearing_seal, "rubber"),
                    circlip=(circlip, "black_oxide"), dowel=(dowel, "steel_ground"), output_shaft=(output_shaft, "steel_turned"))
    mats = {}
    for name, (fn, mat) in builders.items():
        mats[name] = mat
        if only and name not in only:
            continue
        s = fn()
        v = s.val()
        print(name, "valid", v.isValid(), "vol %.1f" % v.Volume(), flush=True)
        exporters.export(s, os.path.join(OUT, name + ".stl"), tolerance=(0.012 if v.BoundingBox().DiagonalLength > 60 else 0.004), angularTolerance=0.05)
    # instances
    place("housing", group="housing", explode=0)
    for i, th in enumerate((90, 210, 330)):
        t = math.radians(th)
        xy = (CD * math.cos(t), CD * math.sin(t), 0)
        place("pin", xy, group="pins", explode=58)
        place("needle", xy, group="needle", explode=84)
        place("planet", xy, rotz=math.degrees(planet_phase(t)), group="planets", explode=74)
        place("washer", xy, group="washers", explode=96)
        place("eclip", xy, rotz=th, group="eclips", explode=104)
    place("carrier", group="carrier", explode=44)
    place("sun", group="sun", explode=66)
    for a in range(0, 360, 60):
        xy = (R_INS * math.cos(math.radians(a)), R_INS * math.sin(math.radians(a)), 0)
        place("insert", xy, group="inserts", explode=16)
        place("shcs", (xy[0], xy[1], 46.8), group="screws", explode=168, variant="closed")
    for p in ("cover",):
        place(p, group="cover", explode=124, variant="closed")
    for p in ("bearing_outer", "bearing_inner", "bearing_seal"):
        place(p, group="bearing", explode=142, variant="closed")
    place("circlip", rotz=90, group="circlip", explode=152, variant="closed")
    place("output_shaft", group="shaft", explode=172, variant="closed")
    place("dowel", group="shaft", explode=172, variant="closed")
    json.dump(dict(mats=mats, inst=inst), open(os.path.join(OUT, "instances.json"), "w"), indent=1)
