#!/bin/zsh
# Final CADForge renders (CF-104 planetary gearhead). Run from this directory.
set -e
cd "$(dirname "$0")"
PY=.venv/bin/python
COMMON="exp=0.3 world=0.3 gear=0.3 gr=0.25 an_spec=0.3 an_coat=0.12 an_rough=0.46"
$PY scene.py hero    final/hero.png    ${SAMPLES:-512} 100 ${=COMMON} world=0.15 ptop=4 pkey=5 pfill=1.5 prim=1.5 priml=1.5 pbg=22 pfront=9 pshadow=10 sp=0.068 cy=-0.645 cz=0.155 lens=85 tz=0.05 2>&1 | grep -E "Error|Saved"
$PY scene.py macro   final/macro.png   ${SAMPLES:-512} 100 ${=COMMON} yaw=-20 cx=0.07 cy=-0.29 cz=0.16 tx=-0.012 ty=-0.05 tz=0.045 fx=-0.015 fy=-0.05 fz=0.05 f=5.6 2>&1 | grep -E "Error|Saved"
$PY scene.py explode final/explode.png ${SAMPLES:-512} 100 ${=COMMON} ex=1.35 yaw=-55 pitch=95 ux=0.13 uy=0.08 uz=0.15 cx=-0.12 cy=-0.6 cz=0.24 tx=0.0 tz=0.142 fz=0.15 lens=48 2>&1 | grep -E "Error|Saved"
R=/Users/varshil/Work/vjg28.github.io/assets/projects
$PY post.py final/hero.png    $R/cadforge.jpg 0.10
$PY post.py final/macro.png   $R/cadforge-macro.jpg 0.10
$PY post.py final/explode.png $R/cadforge-explode.jpg 0.10
