# -*- coding: utf-8 -*-
"""生成《肥嘟嘟 3D 建模》抖音/小红书分享文案 Word 文档。"""
from docx import Document
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "肥嘟嘟_分享文案.docx")
POSTER = os.path.join(HERE, "feedudu_poster.png")

ACCENT = RGBColor(0xD4, 0x8A, 0x0E)   # 暖橙黄
DK = RGBColor(0x2A, 0x2A, 0x2A)
GREY = RGBColor(0x66, 0x66, 0x66)

doc = Document()
style = doc.styles["Normal"]
style.font.name = "Microsoft YaHei"
style.font.size = Pt(11)
style.font.color.rgb = DK

def heading(text, size=15, color=ACCENT, space_before=14, space_after=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(space_before)
    p.paragraph_format.space_after = Pt(space_after)
    r = p.add_run(text); r.bold = True; r.font.size = Pt(size); r.font.color.rgb = color
    return p

def para(text, size=11, color=DK, bold=False, after=4):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(after)
    r = p.add_run(text); r.font.size = Pt(size); r.font.color.rgb = color; r.bold = bold
    return p

def bullet(text, size=11):
    p = doc.add_paragraph(style="List Bullet")
    r = p.add_run(text); r.font.size = Pt(size); r.font.color.rgb = DK
    return p

# ===== 封面标题 =====
t = doc.add_paragraph(); t.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = t.add_run("肥嘟嘟 · 程序化 3D 建模"); r.bold = True; r.font.size = Pt(26); r.font.color.rgb = ACCENT
sub = doc.add_paragraph(); sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = sub.add_run("抖音 / 小红书 分享文案 & 发布指南"); r.font.size = Pt(14); r.font.color.rgb = GREY
meta = doc.add_paragraph(); meta.alignment = WD_ALIGN_PARAGRAPH.CENTER
r = meta.add_run("WorkBuddy × img2threejs  ·  2026-11-02"); r.font.size = Pt(10); r.font.color.rgb = GREY

if os.path.exists(POSTER):
    doc.add_picture(POSTER, width=Inches(3.4))
    doc.paragraphs[-1].alignment = WD_ALIGN_PARAGRAPH.CENTER

# ===== 1. 一句话定位 =====
heading("一、一句话定位")
para("用 WorkBuddy 的 img2threejs 技能，把一张图片变成可在浏览器里自由旋转、实时调参的 Three.js 3D 模型。"
     "本片以「肥嘟嘟」玩偶为例，展示从技能安装、应用场景到 8 阶段雕刻建模的完整过程，直观呈现这项能力的趣味与实用。")

# ===== 2. 视频亮点 =====
heading("二、视频亮点（对应宣传片 5 大场景）")
scenes = [
    ("① 开场钩子", "一张图 → 会转的 3D 玩偶，3 秒抓住注意力。"),
    ("② 技能安装", "终端演示 npx img2threejs install / doctor，WorkBuddy 已识别就绪。"),
    ("③ 应用场景", "手办/IP、产品包装、任意图片转代码、可旋转可二次编辑。"),
    ("④ 8 阶段雕刻", "粗模→结构→形体→材质→表面→光照→交互→优化，实时逐层显形。"),
    ("⑤ 行动号召", "在线把玩「肥嘟嘟」，引导主页/评论区获取链接。"),
]
for k, v in scenes:
    bullet(f"{k}：{v}")

# ===== 3. 标题备选 =====
heading("三、标题备选（直接复制用）")
para("【抖音风】", bold=True, after=2)
for s in [
    "一张照片，AI 把它变成会转的 3D 玩偶🐾 #AI建模",
    "手把手教你把玩偶变成可旋转的 3D 模型，太治愈了！",
    "别再只会 P 图了，让 AI 给你的周边做 3D 化🔥",
    "这个黄色小胖子，是用一行命令生成的 3D 模型？",
]:
    bullet(s)
para("【小红书风】", bold=True, after=2)
for s in [
    "✨用 WorkBuddy 把照片变 3D 玩偶｜零基础也能玩",
    "程序化建模也太好玩了🐾 肥嘟嘟诞生记",
    "打工人摸鱼新姿势：让 AI 把 IP 角色做成可旋转模型",
    "亲测！一张图生成 Three.js 3D 模型全流程记录",
]:
    bullet(s)

# ===== 4. 正文文案 =====
heading("四、正文文案")
para("【抖音口播版】", bold=True, after=2)
para("你还在用普通图片发笔记吗？试试这个——上传一张照片，WorkBuddy 里的 img2threejs 技能"
     "就能把它变成可以在手机里 360° 旋转的 3D 模型。看这只「肥嘟嘟」，从一行安装命令开始，"
     "经过粗模、结构、形体、材质、光照、交互整整 8 道雕刻，最后活灵活现。关键是它生成的是"
     "纯 Three.js 代码，不是死模型，能自由旋转、实时调参、还能二次编辑。手办、IP、产品包装"
     "全都能这么玩。评论区告诉我你想把什么变成 3D，我下期安排！", after=8)

para("【小红书种草版】", bold=True, after=2)
para("最近挖到宝了🥹 用 WorkBuddy + img2threejs 这个组合，把一张普通的玩偶照片，"
     "直接变成了能在网页里拖着转的 3D 模型！", after=2)
para("✅ 零建模基础也能上手：装好技能 → 选图 → 自动分阶段雕刻\n"
     "✅ 不是死图：黄胖子会转、能调参数、可改形状\n"
     "✅ 输出是纯 Three.js 代码，前端同学狂喜\n"
     "✅ 手办 / 周边 / 产品 3D 化一站搞定", after=2)
para("整个建模过程被做成了 54 秒小片，从安装到 8 阶段成型，看完你就懂这项能力有多香～"
     "想玩的姐妹主页自取把玩链接 🔗", after=8)

# ===== 5. 话题标签 =====
heading("五、话题标签（混合使用，勿超平台上限）")
para("#AI建模  #AI绘画  #3D建模  #Threejs  #程序化生成  #AIGC  #玩偶  #手办 "
     "#WorkBuddy  #效率工具  #设计师日常  #种草", color=GREY)

# ===== 6. 分镜脚本 =====
heading("六、视频分镜脚本（54 秒 · 竖屏 1080×1920）")
rows = [
    ("时间", "场景", "画面 / 字幕要点"),
    ("0–5s", "开场钩子", "旋转的黄胖子 + 大字「一张图 → 会转的 3D 玩偶」"),
    ("5–13s", "技能安装", "终端打字 npx img2threejs install / doctor，workbuddy ✓ detected"),
    ("13–22s", "应用场景", "四张卡片：手办/IP、产品包装、任意图片转码、可旋转可改"),
    ("22–44s", "8 阶段雕刻", "模型逐层显形 + 左侧阶段徽章 + 底部 8 步进度高亮"),
    ("44–54s", "行动号召", "「在线把玩肥嘟嘟」+ 主页/评论区获取链接"),
]
table = doc.add_table(rows=1, cols=3)
table.style = "Light Grid Accent 1"
table.alignment = WD_TABLE_ALIGNMENT.CENTER
hdr = table.rows[0].cells
for i, h in enumerate(rows[0]):
    hdr[i].text = h
    for p in hdr[i].paragraphs:
        for rr in p.runs: rr.bold = True; rr.font.size = Pt(10)
for row in rows[1:]:
    cells = table.add_row().cells
    for i, val in enumerate(row):
        cells[i].text = val
        for p in cells[i].paragraphs:
            for rr in p.runs: rr.font.size = Pt(9.5)

# ===== 7. 合规与发布提示 =====
heading("七、合规与发布提示")
for s in [
    "平台规则：抖音/小红书通常不允许在视频与正文直接放外链，引导「主页 / 评论区 / 私信」获取链接更稳妥。",
    "版权：背景音乐请勿使用未授权热门曲，建议用平台自带无版权配乐或静音。",
    "真实性：文案所述「一行命令安装技能、8 阶段建模、纯 Three.js 代码可二次编辑」均属实，可按片演示表述。",
    "肖像与品牌：演示中使用的仅为自建 3D 模型与 WorkBuddy 品牌名，未使用第三方商标素材。",
    "避免夸大：不要用「一键暴富/必火」等绝对化承诺，保持客观描述。",
]:
    bullet(s)

# ===== 8. 素材清单 =====
heading("八、本次交付素材清单")
for s in [
    "视频：feedudu_promo.mp4（54.6s，1080×1920，H.264，抖音/小红书直接兼容）",
    "封面海报：feedudu_poster.png（1080×1350，可作主图/封面）",
    "在线把玩：index.html（肥嘟嘟可旋转/调参的交互模型，需部署到网页后分享链接）",
    "源文件：promo.html（宣传片源）、FeeduduModel.ts（纯 TS 工厂代码）、render_compare.mjs 等",
]:
    bullet(s)
para("说明：发布平台（WorkBuddy Sites）当前创建应用接口暂时不可用，在线把玩链接需待平台恢复后"
     "发布，或自行将 feedudu-threejs 静态目录托管到任意支持静态站的平台即可获得分享网址。",
     color=GREY, size=10)

doc.save(OUT)
print("saved:", OUT)
