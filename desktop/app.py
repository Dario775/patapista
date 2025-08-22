import os
import sqlite3
import bcrypt
import tkinter as tk
from tkinter import ttk, filedialog, messagebox
from PIL import Image, ImageTk
import openai
import pandas as pd
from io import BytesIO
import base64

DB_PATH = os.path.join(os.path.dirname(__file__), 'refe.db')
IMG_DIR = os.path.join(os.path.dirname(__file__), 'images')
if not os.path.exists(IMG_DIR):
    os.makedirs(IMG_DIR)

openai.api_key = os.getenv('OPENAI_API_KEY')

def init_db():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('''CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        password_hash BLOB NOT NULL
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS refes(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        tags TEXT,
        image_path TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS tasks(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        due_date TEXT,
        completed INTEGER DEFAULT 0
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS habits(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        frequency TEXT,
        last_completed TEXT
    )''')
    cur.execute('''CREATE TABLE IF NOT EXISTS readings(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        author TEXT,
        progress TEXT
    )''')
    conn.commit()
    conn.close()


def hash_password(pw: str) -> bytes:
    return bcrypt.hashpw(pw.encode('utf-8'), bcrypt.gensalt())


def verify_password(pw: str, hashed: bytes) -> bool:
    return bcrypt.checkpw(pw.encode('utf-8'), hashed)


def get_user_password():
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT password_hash FROM users LIMIT 1')
    row = cur.fetchone()
    conn.close()
    return row[0] if row else None


def set_user_password(pw: str):
    hashed = hash_password(pw)
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('DELETE FROM users')
    cur.execute('INSERT INTO users(password_hash) VALUES (?)', (hashed,))
    conn.commit()
    conn.close()


def generate_image(prompt: str) -> str:
    if not openai.api_key:
        raise RuntimeError('OPENAI_API_KEY not set')
    try:
        response = openai.images.generate(prompt=prompt, n=1, size='256x256')
        img_b64 = response.data[0].b64_json
        img_bytes = base64.b64decode(img_b64)
        img = Image.open(BytesIO(img_bytes))
        filename = os.path.join(IMG_DIR, f"{prompt.replace(' ', '_')}.png")
        img.save(filename)
        return filename
    except Exception as e:
        messagebox.showerror('AI Image Error', str(e))
        return ''


def chat_with_ai(question: str) -> str:
    if not openai.api_key:
        return 'API key not configured.'
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute('SELECT title, description FROM refes')
    notes = '\n'.join([f"{t}: {d}" for t, d in cur.fetchall()])
    cur.execute('SELECT title, completed FROM tasks')
    tasks = '\n'.join([f"{t} - {'done' if c else 'pending'}" for t, c in cur.fetchall()])
    conn.close()
    context = f"Notas:\n{notes}\nTareas:\n{tasks}"
    try:
        completion = openai.chat.completions.create(
            model='gpt-4o-mini',
            messages=[
                {'role': 'system', 'content': 'Usa la información proporcionada para responder.'},
                {'role': 'user', 'content': context},
                {'role': 'user', 'content': question}
            ]
        )
        return completion.choices[0].message.content
    except Exception as e:
        return f'Error: {e}'


def export_to_excel(filename: str):
    conn = sqlite3.connect(DB_PATH)
    with pd.ExcelWriter(filename) as writer:
        for table in ['refes', 'tasks', 'habits', 'readings']:
            df = pd.read_sql_query(f'SELECT * FROM {table}', conn)
            df.to_excel(writer, sheet_name=table, index=False)
    conn.close()


class LoginWindow(tk.Toplevel):
    def __init__(self, master, on_success):
        super().__init__(master)
        self.on_success = on_success
        self.title('Login')
        self.geometry('300x150')
        tk.Label(self, text='Contraseña').pack(pady=5)
        self.entry = tk.Entry(self, show='*')
        self.entry.pack(pady=5)
        tk.Button(self, text='Aceptar', command=self.check).pack(pady=5)

    def check(self):
        pw_hash = get_user_password()
        pw = self.entry.get()
        if pw_hash is None:
            set_user_password(pw)
            messagebox.showinfo('Info', 'Contraseña establecida.')
            self.destroy()
            self.on_success()
        elif verify_password(pw, pw_hash):
            self.destroy()
            self.on_success()
        else:
            messagebox.showerror('Error', 'Contraseña incorrecta.')


class App(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title('Refe Manager')
        self.geometry('800x600')
        self.notebook = ttk.Notebook(self)
        self.notebook.pack(fill='both', expand=True)
        self.gallery_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.gallery_frame, text='Refes')
        self.task_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.task_frame, text='Tareas')
        self.habit_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.habit_frame, text='Hábitos')
        self.chat_frame = ttk.Frame(self.notebook)
        self.notebook.add(self.chat_frame, text='Chat IA')
        self.render_gallery()
        self.render_task_form()
        self.render_habit_form()
        self.render_chat()
        menu = tk.Menu(self)
        self.config(menu=menu)
        file_menu = tk.Menu(menu, tearoff=0)
        file_menu.add_command(label='Exportar a Excel', command=self.export_data)
        menu.add_cascade(label='Archivo', menu=file_menu)

    def render_gallery(self):
        for widget in self.gallery_frame.winfo_children():
            widget.destroy()
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('SELECT id, title, image_path FROM refes')
        rows = cur.fetchall()
        conn.close()
        for idx, (rid, title, img_path) in enumerate(rows):
            try:
                img = Image.open(img_path)
                img.thumbnail((128, 128))
                photo = ImageTk.PhotoImage(img)
                label = tk.Label(self.gallery_frame, image=photo)
                label.image = photo
                label.grid(row=idx//4, column=idx%4, padx=5, pady=5)
                label.bind('<Button-1>', lambda e, rid=rid: self.show_refe(rid))
            except Exception:
                pass
        tk.Button(self.gallery_frame, text='Agregar Refe', command=self.add_refe).grid(row=len(rows)//4+1, column=0, pady=10)

    def add_refe(self):
        win = tk.Toplevel(self)
        win.title('Nueva Refe')
        tk.Label(win, text='Título').grid(row=0, column=0)
        title_entry = tk.Entry(win)
        title_entry.grid(row=0, column=1)
        tk.Label(win, text='Descripción').grid(row=1, column=0)
        desc_entry = tk.Entry(win)
        desc_entry.grid(row=1, column=1)
        tk.Label(win, text='Etiquetas').grid(row=2, column=0)
        tag_entry = tk.Entry(win)
        tag_entry.grid(row=2, column=1)

        def save():
            title = title_entry.get()
            desc = desc_entry.get()
            tags = tag_entry.get()
            img_path = generate_image(title) or ''
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute('INSERT INTO refes(title, description, tags, image_path) VALUES (?,?,?,?)',
                        (title, desc, tags, img_path))
            conn.commit()
            conn.close()
            win.destroy()
            self.render_gallery()

        tk.Button(win, text='Guardar', command=save).grid(row=3, column=0, columnspan=2)

    def show_refe(self, rid):
        conn = sqlite3.connect(DB_PATH)
        cur = conn.cursor()
        cur.execute('SELECT title, description, tags, image_path FROM refes WHERE id=?', (rid,))
        row = cur.fetchone()
        conn.close()
        if row:
            win = tk.Toplevel(self)
            win.title(row[0])
            tk.Label(win, text=row[1]).pack()
            tk.Label(win, text=f"Etiquetas: {row[2]}").pack()
            if row[3]:
                img = Image.open(row[3])
                photo = ImageTk.PhotoImage(img)
                lbl = tk.Label(win, image=photo)
                lbl.image = photo
                lbl.pack()

    def render_task_form(self):
        tk.Label(self.task_frame, text='Título').grid(row=0, column=0)
        title = tk.Entry(self.task_frame)
        title.grid(row=0, column=1)
        tk.Label(self.task_frame, text='Fecha límite').grid(row=1, column=0)
        due = tk.Entry(self.task_frame)
        due.grid(row=1, column=1)
        def add_task():
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute('INSERT INTO tasks(title, due_date) VALUES (?,?)', (title.get(), due.get()))
            conn.commit()
            conn.close()
            title.delete(0, tk.END)
            due.delete(0, tk.END)
        tk.Button(self.task_frame, text='Agregar', command=add_task).grid(row=2, column=0, columnspan=2)

    def render_habit_form(self):
        tk.Label(self.habit_frame, text='Nombre').grid(row=0, column=0)
        name = tk.Entry(self.habit_frame)
        name.grid(row=0, column=1)
        tk.Label(self.habit_frame, text='Frecuencia').grid(row=1, column=0)
        freq = tk.Entry(self.habit_frame)
        freq.grid(row=1, column=1)
        def add_habit():
            conn = sqlite3.connect(DB_PATH)
            cur = conn.cursor()
            cur.execute('INSERT INTO habits(name, frequency) VALUES (?,?)', (name.get(), freq.get()))
            conn.commit()
            conn.close()
            name.delete(0, tk.END)
            freq.delete(0, tk.END)
        tk.Button(self.habit_frame, text='Agregar', command=add_habit).grid(row=2, column=0, columnspan=2)

    def render_chat(self):
        tk.Label(self.chat_frame, text='Pregunta').pack()
        self.chat_entry = tk.Entry(self.chat_frame, width=80)
        self.chat_entry.pack(pady=5)
        tk.Button(self.chat_frame, text='Enviar', command=self.ask_ai).pack()
        self.chat_output = tk.Text(self.chat_frame, height=15)
        self.chat_output.pack(fill='both', expand=True)

    def ask_ai(self):
        q = self.chat_entry.get()
        ans = chat_with_ai(q)
        self.chat_output.insert(tk.END, f"Yo: {q}\nAI: {ans}\n\n")
        self.chat_entry.delete(0, tk.END)

    def export_data(self):
        filename = filedialog.asksaveasfilename(defaultextension='.xlsx')
        if filename:
            export_to_excel(filename)
            messagebox.showinfo('Exportado', f'Datos exportados a {filename}')


def main():
    init_db()
    app = App()
    def start_app():
        app.deiconify()
    app.withdraw()
    LoginWindow(app, on_success=start_app)
    app.mainloop()

if __name__ == '__main__':
    main()
