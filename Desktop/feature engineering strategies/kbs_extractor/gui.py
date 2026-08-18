"""Pygame GUI for KBS Feature Extractor."""

import json
import logging
import os
import subprocess
import sys
import threading
from pathlib import Path

import arabic_reshaper
import pandas as pd
import pygame
import pygame.freetype
from bidi.algorithm import get_display

from kbs_extractor.pipeline import Pipeline

# ── Constants ───────────────────────────────────────────────────
WIN_W, WIN_H = 1050, 720
FPS = 30
MARGIN = 20
PAD = 12
ROW_H = 32
BTN_H = 40
INPUT_H = 36

COLORS = {
    "bg": (240, 243, 248),
    "surface": (255, 255, 255),
    "primary": (37, 99, 235),
    "primary_hover": (29, 78, 216),
    "primary_text": (255, 255, 255),
    "text": (30, 41, 59),
    "text2": (100, 116, 139),
    "border": (203, 213, 225),
    "input_bg": (248, 250, 252),
    "success": (22, 163, 74),
    "warning": (202, 138, 4),
    "error": (220, 38, 38),
    "high": (220, 38, 38),
    "medium": (202, 138, 4),
    "low": (22, 163, 74),
    "tab_active": (37, 99, 235),
    "tab_inactive": (226, 232, 240),
    "header": (30, 41, 59),
    "header_text": (255, 255, 255),
    "check": (37, 99, 235),
    "scroll_bg": (226, 232, 240),
    "scroll_thumb": (148, 163, 184),
}

AR = {
    "title": "مستخرج الميزات",
    "subtitle": "KBS Feature Extractor",
    "input_file": "ملف الإدخال",
    "output_file": "ملف الإخراج",
    "browse": "استعراض",
    "mode": "الوضع",
    "task_type": "نوع المهمة",
    "auto": "تلقائي",
    "target_col": "العمود الهدف",
    "cat_cols": "الأعمدة الفئوية",
    "run": "تشغيل الاستخراج",
    "running": "جاري المعالجة...",
    "done": "اكتمل!",
    "quality_tab": "تقرير الجودة",
    "features_tab": "الميزات",
    "metadata_tab": "البيانات الوصفية",
    "issues": "المشاكل",
    "suggestions": "الاقتراحات",
    "back": "رجوع",
    "open_folder": "فتح المجلد",
    "error": "خطأ",
    "no_file": "الرجاء اختيار ملف إدخال",
    "none": "-- بدون --",
    "rows": "صف",
    "cols": "عمود",
    "features_count": "عدد الميزات",
}

FONT_PATH = "C:/Windows/Fonts/segoeui.ttf"
FONT_BOLD = "C:/Windows/Fonts/segoeuib.ttf"

# ── Arabic Text Helpers ─────────────────────────────────────────

def _has_arabic(text: str) -> bool:
    return any("؀" <= c <= "ۿ" for c in text)


def render_text(font, text: str, color, size=0):
    if _has_arabic(text):
        shaped = arabic_reshaper.reshape(text)
        visual = get_display(shaped)
    else:
        visual = text
    surf, rect = font.render(visual, fgcolor=color, size=size)
    return surf


# ── File Dialog ─────────────────────────────────────────────────

def _file_dialog_open():
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.askopenfilename(
        title="Select Data File",
        filetypes=[("All supported", "*.csv;*.json;*.jsonl;*.xlsx;*.xls"),
                   ("CSV", "*.csv"), ("JSON", "*.json;*.jsonl"),
                   ("Excel", "*.xlsx;*.xls"), ("All", "*.*")])
    root.destroy()
    return path


def _file_dialog_save():
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    path = filedialog.asksaveasfilename(
        title="Save Features", defaultextension=".csv",
        filetypes=[("CSV files", "*.csv")])
    root.destroy()
    return path


# ── Drawing Helpers ─────────────────────────────────────────────

def draw_card(surf, rect, color=None):
    color = color or COLORS["surface"]
    pygame.draw.rect(surf, color, rect, border_radius=8)
    pygame.draw.rect(surf, COLORS["border"], rect, width=1, border_radius=8)


def draw_text_right(surf, font, text, color, x_right, y, size=0):
    ts = render_text(font, text, color, size)
    surf.blit(ts, (x_right - ts.get_width(), y))
    return ts


# ── Widgets ─────────────────────────────────────────────────────

class Button:
    def __init__(self, rect, label, font, on_click=None, primary=True):
        self.rect = pygame.Rect(rect)
        self.label = label
        self.font = font
        self.on_click = on_click
        self.primary = primary
        self.hovered = False

    def draw(self, surf):
        mx, my = pygame.mouse.get_pos()
        self.hovered = self.rect.collidepoint(mx, my)
        if self.primary:
            bg = COLORS["primary_hover"] if self.hovered else COLORS["primary"]
            fg = COLORS["primary_text"]
        else:
            bg = COLORS["tab_inactive"] if not self.hovered else COLORS["border"]
            fg = COLORS["text"]
        pygame.draw.rect(surf, bg, self.rect, border_radius=6)
        ts = render_text(self.font, self.label, fg)
        surf.blit(ts, (self.rect.centerx - ts.get_width() // 2,
                       self.rect.centery - ts.get_height() // 2))

    def handle(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos) and self.on_click:
                self.on_click()
                return True
        return False


class RadioGroup:
    def __init__(self, x, y, options, font, selected=0):
        self.x, self.y = x, y
        self.options = options
        self.font = font
        self.selected = selected
        self.rects = []
        self._build()

    def _build(self):
        self.rects = []
        cy = self.y
        for opt in self.options:
            self.rects.append(pygame.Rect(self.x, cy, 200, ROW_H))
            cy += ROW_H

    def draw(self, surf):
        for i, (opt, rc) in enumerate(zip(self.options, self.rects)):
            cx, cy = rc.x + 10, rc.centery
            color = COLORS["primary"] if i == self.selected else COLORS["border"]
            pygame.draw.circle(surf, color, (cx, cy), 8, 2)
            if i == self.selected:
                pygame.draw.circle(surf, COLORS["primary"], (cx, cy), 4)
            ts = render_text(self.font, opt, COLORS["text"])
            surf.blit(ts, (cx + 16, cy - ts.get_height() // 2))

    def handle(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for i, rc in enumerate(self.rects):
                if rc.collidepoint(event.pos):
                    self.selected = i
                    return True
        return False

    @property
    def value(self):
        return self.options[self.selected]


class CheckboxGrid:
    def __init__(self, rect, items, font):
        self.rect = pygame.Rect(rect)
        self.items = items
        self.font = font
        self.checked = set()
        self.scroll_y = 0
        self.col_w = 150
        self.row_h = 30
        self.cols = max(1, (self.rect.w - 20) // self.col_w)

    def set_items(self, items):
        self.items = items
        self.checked = set()
        self.scroll_y = 0
        self.cols = max(1, (self.rect.w - 20) // self.col_w)

    @property
    def total_h(self):
        rows = (len(self.items) + self.cols - 1) // self.cols
        return rows * self.row_h

    def draw(self, surf):
        clip_prev = surf.get_clip()
        surf.set_clip(self.rect)
        for idx, name in enumerate(self.items):
            row, col = divmod(idx, self.cols)
            x = self.rect.x + col * self.col_w + 4
            y = self.rect.y + row * self.row_h - self.scroll_y + 4
            if y + self.row_h < self.rect.y or y > self.rect.bottom:
                continue
            box = pygame.Rect(x, y + 4, 18, 18)
            pygame.draw.rect(surf, COLORS["border"], box, border_radius=3)
            if name in self.checked:
                pygame.draw.rect(surf, COLORS["check"], box.inflate(-4, -4), border_radius=2)
            ts = render_text(self.font, name, COLORS["text"])
            surf.blit(ts, (x + 24, y + 4))
        surf.set_clip(clip_prev)

        if self.total_h > self.rect.h:
            sb_rect = pygame.Rect(self.rect.right - 6, self.rect.y, 6, self.rect.h)
            pygame.draw.rect(surf, COLORS["scroll_bg"], sb_rect, border_radius=3)
            ratio = self.rect.h / self.total_h
            thumb_h = max(20, int(self.rect.h * ratio))
            thumb_y = self.rect.y + int(self.scroll_y / self.total_h * self.rect.h)
            thumb = pygame.Rect(sb_rect.x, thumb_y, 6, thumb_h)
            pygame.draw.rect(surf, COLORS["scroll_thumb"], thumb, border_radius=3)

    def handle(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                mx, my = event.pos
                for idx, name in enumerate(self.items):
                    row, col = divmod(idx, self.cols)
                    x = self.rect.x + col * self.col_w + 4
                    y = self.rect.y + row * self.row_h - self.scroll_y + 4
                    box = pygame.Rect(x, y + 4, 18, 18)
                    if box.collidepoint(mx, my):
                        if name in self.checked:
                            self.checked.discard(name)
                        else:
                            self.checked.add(name)
                        return True
                return True
        if event.type == pygame.MOUSEWHEEL and self.rect.collidepoint(pygame.mouse.get_pos()):
            self.scroll_y = max(0, min(self.scroll_y - event.y * 20,
                                       max(0, self.total_h - self.rect.h)))
            return True
        return False


class Dropdown:
    def __init__(self, rect, options, font, selected=0):
        self.rect = pygame.Rect(rect)
        self.options = options
        self.font = font
        self.selected = selected
        self.open = False

    def set_options(self, options):
        self.options = options
        self.selected = 0
        self.open = False

    @property
    def value(self):
        if not self.options:
            return None
        return self.options[self.selected]

    def draw(self, surf):
        pygame.draw.rect(surf, COLORS["input_bg"], self.rect, border_radius=4)
        pygame.draw.rect(surf, COLORS["border"], self.rect, width=1, border_radius=4)
        label = self.options[self.selected] if self.options else "---"
        ts = render_text(self.font, label, COLORS["text"])
        surf.blit(ts, (self.rect.x + 8, self.rect.centery - ts.get_height() // 2))
        arrow = render_text(self.font, "▼" if not self.open else "▲", COLORS["text2"])
        surf.blit(arrow, (self.rect.right - 24, self.rect.centery - arrow.get_height() // 2))

    def draw_overlay(self, surf):
        if not self.open or not self.options:
            return
        item_h = ROW_H
        list_h = min(len(self.options) * item_h, 200)
        list_rect = pygame.Rect(self.rect.x, self.rect.bottom, self.rect.w, list_h)
        pygame.draw.rect(surf, COLORS["surface"], list_rect, border_radius=4)
        pygame.draw.rect(surf, COLORS["border"], list_rect, width=1, border_radius=4)
        mx, my = pygame.mouse.get_pos()
        for i, opt in enumerate(self.options):
            ry = list_rect.y + i * item_h
            if ry + item_h > list_rect.bottom:
                break
            item_rect = pygame.Rect(list_rect.x, ry, list_rect.w, item_h)
            if item_rect.collidepoint(mx, my):
                pygame.draw.rect(surf, COLORS["tab_inactive"], item_rect)
            ts = render_text(self.font, opt, COLORS["text"])
            surf.blit(ts, (item_rect.x + 8, item_rect.centery - ts.get_height() // 2))

    def handle(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                self.open = not self.open
                return True
            if self.open:
                item_h = ROW_H
                list_rect = pygame.Rect(self.rect.x, self.rect.bottom,
                                        self.rect.w, len(self.options) * item_h)
                if list_rect.collidepoint(event.pos):
                    idx = (event.pos[1] - list_rect.y) // item_h
                    if 0 <= idx < len(self.options):
                        self.selected = idx
                self.open = False
                return True
        return False


class ScrollList:
    SEL_COLOR = (219, 234, 254)
    SEL_BORDER = (147, 197, 253)

    def __init__(self, rect, font):
        self.rect = pygame.Rect(rect)
        self.font = font
        self.items = []
        self.scroll_y = 0
        self.selected: set[int] = set()

    def set_items(self, items):
        self.items = items
        self.scroll_y = 0
        self.selected = set()

    @property
    def total_h(self):
        return len(self.items) * ROW_H

    def _item_to_text(self, item) -> str:
        if isinstance(item, dict):
            sev = item.get("severity", "")
            col = item.get("column", "")
            kind = item.get("kind", "")
            desc = item.get("description", item.get("rationale", ""))
            action = item.get("action", "")
            if action:
                return f"[{sev.upper()}] {col} | {action} — {desc}"
            return f"[{sev.upper()}] {col} | {kind} — {desc}"
        return str(item)

    def get_selected_text(self) -> str:
        if not self.selected:
            return "\n".join(self._item_to_text(it) for it in self.items)
        indices = sorted(self.selected)
        return "\n".join(self._item_to_text(self.items[i]) for i in indices if i < len(self.items))

    def get_all_text(self) -> str:
        return "\n".join(self._item_to_text(it) for it in self.items)

    def copy_to_clipboard(self, text: str | None = None):
        content = text or self.get_selected_text()
        try:
            import subprocess
            process = subprocess.Popen(["clip"], stdin=subprocess.PIPE)
            process.communicate(content.encode("utf-16-le"))
        except Exception:
            pass

    def draw(self, surf):
        clip_prev = surf.get_clip()
        surf.set_clip(self.rect)
        for i, item in enumerate(self.items):
            y = self.rect.y + i * ROW_H - self.scroll_y
            if y + ROW_H < self.rect.y or y > self.rect.bottom:
                continue
            row_rect = pygame.Rect(self.rect.x, y, self.rect.w - 8, ROW_H)
            if i in self.selected:
                pygame.draw.rect(surf, self.SEL_COLOR, row_rect)
                pygame.draw.rect(surf, self.SEL_BORDER, row_rect, width=1)
            if isinstance(item, dict):
                self._draw_issue_row(surf, item, self.rect.x + 4, y)
            else:
                ts = render_text(self.font, str(item), COLORS["text"])
                surf.blit(ts, (self.rect.x + 8, y + 4))
        surf.set_clip(clip_prev)

        if self.total_h > self.rect.h:
            sb_x = self.rect.right - 6
            pygame.draw.rect(surf, COLORS["scroll_bg"],
                             (sb_x, self.rect.y, 6, self.rect.h), border_radius=3)
            ratio = self.rect.h / max(self.total_h, 1)
            th = max(20, int(self.rect.h * ratio))
            ty = self.rect.y + int(self.scroll_y / max(self.total_h, 1) * self.rect.h)
            pygame.draw.rect(surf, COLORS["scroll_thumb"],
                             (sb_x, ty, 6, th), border_radius=3)

    def _draw_issue_row(self, surf, item, x, y):
        sev = item.get("severity", "low")
        badge_color = COLORS.get(sev, COLORS["text2"])
        badge_rect = pygame.Rect(x + 4, y + 6, 60, 20)
        pygame.draw.rect(surf, badge_color, badge_rect, border_radius=3)
        ts = render_text(self.font, sev.upper(), COLORS["primary_text"], size=12)
        surf.blit(ts, (badge_rect.centerx - ts.get_width() // 2,
                       badge_rect.centery - ts.get_height() // 2))
        col = item.get("column", "")
        kind = item.get("kind", "")
        desc = item.get("description", item.get("rationale", ""))
        action = item.get("action", "")
        if action:
            line = f"{col} | {action} — {desc}"
        else:
            line = f"{col} | {kind} — {desc}"
        ts2 = render_text(self.font, line, COLORS["text"], size=13)
        surf.blit(ts2, (x + 70, y + 7))

    def handle(self, event):
        if event.type == pygame.MOUSEWHEEL and self.rect.collidepoint(pygame.mouse.get_pos()):
            self.scroll_y = max(0, min(self.scroll_y - event.y * 30,
                                       max(0, self.total_h - self.rect.h)))
            return True

        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            if self.rect.collidepoint(event.pos):
                row_idx = int((event.pos[1] - self.rect.y + self.scroll_y) // ROW_H)
                if 0 <= row_idx < len(self.items):
                    mods = pygame.key.get_mods()
                    if mods & pygame.KMOD_CTRL:
                        if row_idx in self.selected:
                            self.selected.discard(row_idx)
                        else:
                            self.selected.add(row_idx)
                    elif mods & pygame.KMOD_SHIFT and self.selected:
                        anchor = min(self.selected)
                        start, end = min(anchor, row_idx), max(anchor, row_idx)
                        self.selected = set(range(start, end + 1))
                    else:
                        self.selected = {row_idx}
                    return True

        if event.type == pygame.KEYDOWN:
            mods = pygame.key.get_mods()
            if mods & pygame.KMOD_CTRL:
                if event.key == pygame.K_c:
                    self.copy_to_clipboard()
                    return True
                if event.key == pygame.K_a:
                    self.selected = set(range(len(self.items)))
                    return True

        return False


# ── Pipeline Runner (threaded) ──────────────────────────────────

class GUILogHandler(logging.Handler):
    def __init__(self, runner):
        super().__init__()
        self.runner = runner

    def emit(self, record):
        msg = record.getMessage()
        with self.runner.lock:
            self.runner.message = msg


class PipelineRunner:
    def __init__(self):
        self.status = "idle"
        self.message = ""
        self.pipeline = None
        self.result_df = None
        self.error = None
        self.lock = threading.Lock()
        self._thread = None

    def start(self, input_path, output_path, mode, target, report_path,
              categoricals, task_type):
        with self.lock:
            self.status = "running"
            self.message = "جاري التحميل..."
            self.error = None
            self.result_df = None
            self.pipeline = None

        handler = GUILogHandler(self)
        for name in ["kbs.pipeline", "kbs.profiler", "kbs.graph",
                      "kbs.quality", "kbs.features"]:
            logging.getLogger(name).addHandler(handler)

        self._thread = threading.Thread(
            target=self._run, daemon=True,
            args=(input_path, output_path, mode, target, report_path,
                  categoricals, task_type, handler))
        self._thread.start()

    def _run(self, input_path, output_path, mode, target, report_path,
             categoricals, task_type, handler):
        try:
            pipe = Pipeline(
                input_path=input_path,
                output_path=output_path,
                mode=mode,
                target_column=target,
                report_path=report_path,
                categorical_columns=categoricals,
                task_type=task_type,
            )
            result = pipe.run()
            with self.lock:
                self.pipeline = pipe
                self.result_df = result
                self.status = "done"
        except Exception as e:
            with self.lock:
                self.error = str(e)
                self.status = "error"
        finally:
            for name in ["kbs.pipeline", "kbs.profiler", "kbs.graph",
                          "kbs.quality", "kbs.features"]:
                logging.getLogger(name).removeHandler(handler)


# ── Screens ─────────────────────────────────────────────────────

class SetupScreen:
    def __init__(self, fonts):
        self.fonts = fonts
        self.input_path = ""
        self.output_path = ""
        self.columns = []

        lx = MARGIN + 20
        rx = WIN_W - MARGIN - 20

        self.mode_radio = RadioGroup(lx, 270, ["full", "quality", "features"],
                                     fonts["normal"], 0)
        self.task_radio = RadioGroup(lx + 250, 270, ["auto", "classification", "regression"],
                                     fonts["normal"], 0)
        self.target_dd = Dropdown((lx, 400, 400, INPUT_H), [AR["none"]], fonts["normal"])
        self.cat_grid = CheckboxGrid((lx, 480, rx - lx, 130), [], fonts["small"])

        self.browse_in = Button((rx - 90, 155, 90, INPUT_H), AR["browse"],
                                fonts["normal"], self._browse_input, False)
        self.browse_out = Button((rx - 90, 210, 90, INPUT_H), AR["browse"],
                                 fonts["normal"], self._browse_output, False)
        self.run_btn = Button((WIN_W // 2 - 120, 630, 240, 45), AR["run"],
                              fonts["bold"], None, True)
        self.error_msg = ""

    def _browse_input(self):
        path = _file_dialog_open()
        if path:
            self.input_path = path
            stem = Path(path).stem
            self.output_path = str(Path(path).with_name(stem + "_features.csv"))
            try:
                from kbs_extractor.pipeline import Pipeline
                df = Pipeline._load_data(path).head(0)
                cols = [c.strip() for c in df.columns.tolist()]
                self.columns = cols
                self.target_dd.set_options([AR["none"]] + cols)
                self.cat_grid.set_items(cols)
            except Exception:
                self.columns = []
            self.error_msg = ""

    def _browse_output(self):
        path = _file_dialog_save()
        if path:
            self.output_path = path

    def draw(self, surf):
        f, fb, fs = self.fonts["normal"], self.fonts["bold"], self.fonts["small"]
        lx = MARGIN + 20
        rx = WIN_W - MARGIN - 20

        card = pygame.Rect(MARGIN, 130, WIN_W - 2 * MARGIN, 540)
        draw_card(surf, card)

        y = 140
        draw_text_right(surf, fb, AR["input_file"], COLORS["text"], rx, y)
        inp_rect = pygame.Rect(lx, y + 20, rx - lx - 100, INPUT_H)
        pygame.draw.rect(surf, COLORS["input_bg"], inp_rect, border_radius=4)
        pygame.draw.rect(surf, COLORS["border"], inp_rect, width=1, border_radius=4)
        disp = self.input_path if self.input_path else "..."
        if len(disp) > 70:
            disp = "..." + disp[-67:]
        ts = render_text(fs, disp, COLORS["text2"] if not self.input_path else COLORS["text"])
        surf.blit(ts, (inp_rect.x + 6, inp_rect.centery - ts.get_height() // 2))
        self.browse_in.rect.topleft = (rx - 90, y + 20)
        self.browse_in.draw(surf)

        y = 195
        draw_text_right(surf, fb, AR["output_file"], COLORS["text"], rx, y)
        out_rect = pygame.Rect(lx, y + 20, rx - lx - 100, INPUT_H)
        pygame.draw.rect(surf, COLORS["input_bg"], out_rect, border_radius=4)
        pygame.draw.rect(surf, COLORS["border"], out_rect, width=1, border_radius=4)
        disp2 = self.output_path if self.output_path else "..."
        if len(disp2) > 70:
            disp2 = "..." + disp2[-67:]
        ts2 = render_text(fs, disp2, COLORS["text2"] if not self.output_path else COLORS["text"])
        surf.blit(ts2, (out_rect.x + 6, out_rect.centery - ts2.get_height() // 2))
        self.browse_out.rect.topleft = (rx - 90, y + 20)
        self.browse_out.draw(surf)

        y = 255
        draw_text_right(surf, fb, AR["mode"], COLORS["text"], lx + 200, y)
        draw_text_right(surf, fb, AR["task_type"], COLORS["text"], lx + 450, y)
        self.mode_radio.y = y + 22
        self.mode_radio._build()
        self.mode_radio.draw(surf)
        self.task_radio.x = lx + 250
        self.task_radio.y = y + 22
        self.task_radio._build()
        self.task_radio.draw(surf)

        y = 380
        draw_text_right(surf, fb, AR["target_col"], COLORS["text"], rx, y)
        self.target_dd.rect.topleft = (lx, y + 22)
        self.target_dd.draw(surf)

        y = 450
        draw_text_right(surf, fb, AR["cat_cols"], COLORS["text"], rx, y)
        self.cat_grid.rect.topleft = (lx, y + 25)
        self.cat_grid.draw(surf)

        self.run_btn.draw(surf)

        if self.error_msg:
            ts_err = render_text(fb, self.error_msg, COLORS["error"])
            surf.blit(ts_err, (WIN_W // 2 - ts_err.get_width() // 2, 615))

        self.target_dd.draw_overlay(surf)

    def handle(self, event):
        if self.target_dd.open:
            if self.target_dd.handle(event):
                return True

        for w in [self.browse_in, self.browse_out, self.run_btn,
                  self.mode_radio, self.task_radio, self.target_dd, self.cat_grid]:
            if w.handle(event):
                return True
        return False

    def get_config(self):
        target = self.target_dd.value
        if target == AR["none"]:
            target = None
        task = self.task_radio.value
        if task == "auto":
            task = None
        cats = list(self.cat_grid.checked)
        return {
            "input_path": self.input_path,
            "output_path": self.output_path,
            "mode": self.mode_radio.value,
            "target": target,
            "categoricals": cats,
            "task_type": task,
        }

    def validate(self) -> str | None:
        if not self.input_path or not Path(self.input_path).exists():
            return AR["no_file"]
        return None


class RunningScreen:
    def __init__(self, fonts, runner: PipelineRunner):
        self.fonts = fonts
        self.runner = runner
        self.anim_x = 0
        self.anim_dir = 1

    def draw(self, surf):
        f, fb = self.fonts["normal"], self.fonts["bold"]

        card = pygame.Rect(WIN_W // 2 - 250, WIN_H // 2 - 120, 500, 240)
        draw_card(surf, card)

        ts = render_text(fb, AR["running"], COLORS["primary"], size=22)
        surf.blit(ts, (card.centerx - ts.get_width() // 2, card.y + 30))

        bar_rect = pygame.Rect(card.x + 30, card.centery - 10, card.w - 60, 20)
        pygame.draw.rect(surf, COLORS["scroll_bg"], bar_rect, border_radius=10)
        self.anim_x += self.anim_dir * 4
        if self.anim_x > bar_rect.w - 80:
            self.anim_dir = -1
        elif self.anim_x < 0:
            self.anim_dir = 1
        pill = pygame.Rect(bar_rect.x + self.anim_x, bar_rect.y, 80, 20)
        pygame.draw.rect(surf, COLORS["primary"], pill, border_radius=10)

        with self.runner.lock:
            msg = self.runner.message
        if msg:
            if len(msg) > 70:
                msg = msg[:67] + "..."
            ts2 = render_text(f, msg, COLORS["text2"], size=13)
            surf.blit(ts2, (card.centerx - ts2.get_width() // 2, card.centery + 30))

    def handle(self, event):
        return False


class ResultsScreen:
    def __init__(self, fonts):
        self.fonts = fonts
        self.active_tab = 0
        self.tab_names = [AR["quality_tab"], AR["features_tab"], AR["metadata_tab"]]
        self.tab_rects = []

        content_rect = pygame.Rect(MARGIN, 180, WIN_W - 2 * MARGIN, WIN_H - 250)
        self.issues_list = ScrollList(
            (content_rect.x + 10, content_rect.y + 40,
             content_rect.w - 20, (content_rect.h - 80) // 2),
            fonts["small"])
        self.suggestions_list = ScrollList(
            (content_rect.x + 10, content_rect.y + content_rect.h // 2 + 10,
             content_rect.w - 20, (content_rect.h - 80) // 2),
            fonts["small"])
        self.features_list = ScrollList(
            (content_rect.x + 10, content_rect.y + 40, content_rect.w - 20, content_rect.h - 60),
            fonts["small"])
        self.meta_list = ScrollList(
            (content_rect.x + 10, content_rect.y + 40, content_rect.w - 20, content_rect.h - 60),
            fonts["small"])

        self.back_btn = Button((MARGIN + 20, WIN_H - 55, 120, 38), AR["back"],
                               fonts["normal"], None, False)
        self.copy_btn = Button((WIN_W // 2 - 70, WIN_H - 55, 140, 38),
                                "Ctrl+C / نسخ", fonts["normal"], self._copy_active, False)
        self.folder_btn = Button((WIN_W - MARGIN - 150, WIN_H - 55, 140, 38),
                                 AR["open_folder"], fonts["normal"], None, False)
        self.output_path = ""
        self.quality_result = {}
        self.result_df = None
        self.metadata = []
        self.features_summary = ""
        self.copy_flash = 0

    def _get_active_lists(self) -> list[ScrollList]:
        if self.active_tab == 0:
            return [self.issues_list, self.suggestions_list]
        elif self.active_tab == 1:
            return [self.features_list]
        elif self.active_tab == 2:
            return [self.meta_list]
        return []

    def _copy_active(self):
        parts = []
        for lst in self._get_active_lists():
            text = lst.get_selected_text()
            if text:
                parts.append(text)
        combined = "\n\n".join(parts)
        if combined:
            try:
                import subprocess
                process = subprocess.Popen(["clip"], stdin=subprocess.PIPE)
                process.communicate(combined.encode("utf-16-le"))
                self.copy_flash = 60
            except Exception:
                pass

    def set_results(self, pipeline, result_df, output_path):
        self.output_path = output_path
        self.quality_result = pipeline.quality_result if pipeline else {}
        self.result_df = result_df
        self.metadata = pipeline.metadata if pipeline else []

        issues = self.quality_result.get("issues", [])
        suggestions = self.quality_result.get("suggestions", [])
        self.issues_list.set_items(issues)
        self.suggestions_list.set_items(suggestions)

        if result_df is not None:
            lines = []
            cols = list(result_df.columns)
            self.features_summary = f"{len(result_df)} {AR['rows']} x {len(cols)} {AR['cols']}"
            header = " | ".join(cols[:8])
            if len(cols) > 8:
                header += f" ... (+{len(cols)-8})"
            lines.append(header)
            lines.append("-" * 80)
            for _, row in result_df.head(30).iterrows():
                vals = [f"{row[c]:.3f}" if isinstance(row[c], float) else str(row[c])
                        for c in cols[:8]]
                lines.append(" | ".join(vals))
            self.features_list.set_items(lines)
        else:
            self.features_list.set_items(["Quality-only mode — no features generated"])
            self.features_summary = ""

        meta_lines = []
        for m in self.metadata:
            feat = m.get("feature", "")
            src = str(m.get("source", ""))
            op = m.get("operation", "")
            rat = m.get("rationale", "")
            meta_lines.append(f"{feat}  |  {op}  |  {rat[:50]}")
        self.meta_list.set_items(meta_lines)

    def draw(self, surf):
        f, fb, fs = self.fonts["normal"], self.fonts["bold"], self.fonts["small"]

        tab_w = 160
        tab_y = 140
        self.tab_rects = []
        for i, name in enumerate(self.tab_names):
            tr = pygame.Rect(MARGIN + i * (tab_w + 4), tab_y, tab_w, 34)
            self.tab_rects.append(tr)
            bg = COLORS["tab_active"] if i == self.active_tab else COLORS["tab_inactive"]
            fg = COLORS["primary_text"] if i == self.active_tab else COLORS["text"]
            pygame.draw.rect(surf, bg, tr, border_radius=6)
            ts = render_text(f, name, fg)
            surf.blit(ts, (tr.centerx - ts.get_width() // 2,
                           tr.centery - ts.get_height() // 2))

        content = pygame.Rect(MARGIN, 180, WIN_W - 2 * MARGIN, WIN_H - 250)
        draw_card(surf, content)

        if self.active_tab == 0:
            issues = self.quality_result.get("issues", [])
            suggestions = self.quality_result.get("suggestions", [])
            ts = render_text(fb, f"{AR['issues']} ({len(issues)})", COLORS["text"])
            surf.blit(ts, (content.x + 10, content.y + 10))
            self.issues_list.draw(surf)

            mid_y = content.y + content.h // 2 - 5
            pygame.draw.line(surf, COLORS["border"], (content.x + 10, mid_y),
                             (content.right - 10, mid_y))
            ts2 = render_text(fb, f"{AR['suggestions']} ({len(suggestions)})", COLORS["text"])
            surf.blit(ts2, (content.x + 10, mid_y + 5))
            self.suggestions_list.rect.top = mid_y + 30
            self.suggestions_list.rect.height = content.bottom - mid_y - 40
            self.suggestions_list.draw(surf)

        elif self.active_tab == 1:
            if self.features_summary:
                ts = render_text(fb, f"{AR['features_count']}: {self.features_summary}",
                                 COLORS["primary"])
                surf.blit(ts, (content.x + 10, content.y + 10))
            self.features_list.draw(surf)

        elif self.active_tab == 2:
            ts = render_text(fb, f"{AR['metadata_tab']} ({len(self.metadata)})", COLORS["text"])
            surf.blit(ts, (content.x + 10, content.y + 10))
            self.meta_list.draw(surf)

        self.back_btn.draw(surf)
        self.copy_btn.draw(surf)
        self.folder_btn.draw(surf)

        if self.copy_flash > 0:
            self.copy_flash -= 1
            ts_cp = render_text(fb, "-- تم النسخ --", COLORS["success"])
            surf.blit(ts_cp, (WIN_W // 2 - ts_cp.get_width() // 2, WIN_H - 85))

    def handle(self, event):
        if event.type == pygame.MOUSEBUTTONDOWN and event.button == 1:
            for i, tr in enumerate(self.tab_rects):
                if tr.collidepoint(event.pos):
                    self.active_tab = i
                    return True

        for w in [self.back_btn, self.copy_btn, self.folder_btn]:
            if w.handle(event):
                return True

        for lst in self._get_active_lists():
            if lst.handle(event):
                return True

        if event.type == pygame.KEYDOWN and (pygame.key.get_mods() & pygame.KMOD_CTRL):
            if event.key == pygame.K_c:
                self._copy_active()
                return True
            if event.key == pygame.K_a:
                for lst in self._get_active_lists():
                    lst.selected = set(range(len(lst.items)))
                return True

        return False


# ── App Controller ──────────────────────────────────────────────

class App:
    def __init__(self):
        pygame.init()
        pygame.freetype.init()
        self.screen = pygame.display.set_mode((WIN_W, WIN_H))
        pygame.display.set_caption("KBS Feature Extractor")
        self.clock = pygame.time.Clock()

        self.font = pygame.freetype.Font(FONT_PATH, 16)
        self.font_bold = pygame.freetype.Font(FONT_BOLD, 16)
        self.font_sm = pygame.freetype.Font(FONT_PATH, 13)
        self.font_lg = pygame.freetype.Font(FONT_PATH, 24)
        self.fonts = {
            "normal": self.font, "bold": self.font_bold,
            "small": self.font_sm, "large": self.font_lg,
        }

        self.runner = PipelineRunner()
        self.setup = SetupScreen(self.fonts)
        self.running_scr = RunningScreen(self.fonts, self.runner)
        self.results = ResultsScreen(self.fonts)

        self.state = "setup"
        self.alive = True
        self.error_text = ""

        self.setup.run_btn.on_click = self._on_run
        self.results.back_btn.on_click = self._on_back
        self.results.folder_btn.on_click = self._on_open_folder

    def _on_run(self):
        err = self.setup.validate()
        if err:
            self.setup.error_msg = err
            return
        cfg = self.setup.get_config()
        report_path = str(Path(cfg["output_path"]).with_suffix(".report.json"))
        self.runner.start(
            input_path=cfg["input_path"],
            output_path=cfg["output_path"],
            mode=cfg["mode"],
            target=cfg["target"],
            report_path=report_path,
            categoricals=cfg["categoricals"],
            task_type=cfg["task_type"],
        )
        self.state = "running"

    def _on_back(self):
        self.state = "setup"

    def _on_open_folder(self):
        path = self.results.output_path
        if path and Path(path).exists():
            subprocess.Popen(f'explorer /select,"{path}"')

    def run(self):
        while self.alive:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    self.alive = False
                    break
                self._handle_event(event)

            self._update()
            self._draw()
            self.clock.tick(FPS)

        pygame.quit()

    def _handle_event(self, event):
        if self.state == "setup":
            self.setup.handle(event)
        elif self.state == "running":
            self.running_scr.handle(event)
        elif self.state == "results":
            self.results.handle(event)
        elif self.state == "error":
            if event.type == pygame.MOUSEBUTTONDOWN:
                self.state = "setup"

    def _update(self):
        if self.state == "running":
            with self.runner.lock:
                status = self.runner.status
            if status == "done":
                cfg = self.setup.get_config()
                self.results.set_results(
                    self.runner.pipeline, self.runner.result_df, cfg["output_path"])
                self.state = "results"
            elif status == "error":
                self.error_text = self.runner.error or "Unknown error"
                self.state = "error"

    def _draw(self):
        self.screen.fill(COLORS["bg"])
        self._draw_header()

        if self.state == "setup":
            self.setup.draw(self.screen)
        elif self.state == "running":
            self.running_scr.draw(self.screen)
        elif self.state == "results":
            self.results.draw(self.screen)
        elif self.state == "error":
            self._draw_error()

        pygame.display.flip()

    def _draw_header(self):
        header = pygame.Rect(0, 0, WIN_W, 110)
        pygame.draw.rect(self.screen, COLORS["header"], header)

        ts = render_text(self.font_lg, AR["title"], COLORS["header_text"], size=28)
        self.screen.blit(ts, (WIN_W // 2 - ts.get_width() // 2, 20))

        ts2 = render_text(self.font, AR["subtitle"], COLORS["tab_inactive"], size=16)
        self.screen.blit(ts2, (WIN_W // 2 - ts2.get_width() // 2, 60))

        ts3 = render_text(self.font_sm, "v1.0.0", COLORS["text2"], size=12)
        self.screen.blit(ts3, (WIN_W // 2 - ts3.get_width() // 2, 85))

    def _draw_error(self):
        overlay = pygame.Surface((WIN_W, WIN_H), pygame.SRCALPHA)
        overlay.fill((0, 0, 0, 120))
        self.screen.blit(overlay, (0, 0))

        card = pygame.Rect(WIN_W // 2 - 250, WIN_H // 2 - 80, 500, 160)
        pygame.draw.rect(self.screen, COLORS["surface"], card, border_radius=10)
        pygame.draw.rect(self.screen, COLORS["error"], card, width=2, border_radius=10)

        ts = render_text(self.font_bold, AR["error"], COLORS["error"], size=20)
        self.screen.blit(ts, (card.centerx - ts.get_width() // 2, card.y + 15))

        err_text = self.error_text
        if len(err_text) > 60:
            err_text = err_text[:57] + "..."
        ts2 = render_text(self.font, err_text, COLORS["text"], size=14)
        self.screen.blit(ts2, (card.centerx - ts2.get_width() // 2, card.centery - 5))

        ts3 = render_text(self.font_sm, "Click anywhere to go back", COLORS["text2"])
        self.screen.blit(ts3, (card.centerx - ts3.get_width() // 2, card.bottom - 30))


# ── Entry Point ─────────────────────────────────────────────────

def main():
    app = App()
    app.run()


if __name__ == "__main__":
    main()
