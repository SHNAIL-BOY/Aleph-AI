const $ = s => document.querySelector(s);
const messages = $("#messages"),
    input = $("#input"),
    form = $("#composer"),
    send = $("#send"),
    status = $("#status");
let history = JSON.parse(localStorage.getItem("shnail-history") || "[]"),
    busy = false;

function esc(s) {
    return s.replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    } [c]));
}

function md(s) {
    return esc(s).replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>").replace(/`([^`]+)`/g, "<code>$1</code>").replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/\n/g, "<br>");
}

function save() {
    localStorage.setItem("shnail-history", JSON.stringify(history));
}

function add(role, text, saveIt = true) {
    $("#welcome")?.remove();
    const el = document.createElement("div");
    el.className = "message " + (role === "user" ? "user" : "ai");
    el.innerHTML = `<div class="avatar">${role==="user"?"You":"ℵ₀"}</div><div class="bubble">${role==="assistant"?md(text):esc(text)}</div>`;
    messages.appendChild(el);
    messages.scrollTop = messages.scrollHeight;
    if (saveIt) save();
    return el;
}

function load() {
    history.forEach(m => add(m.role, m.content, false));
}
async function health() {
    try {
        let r = await fetch("functions/API/health.js");
        let d = await r.json();
        status.classList.add("ok");
        status.innerHTML = "<i></i> Online";
        $("#model").textContent = d.model || "AI assistant"
    } catch {
        status.innerHTML = "<i></i> Offline"
    }
}
async function chat(text) {
    if (!text.trim() || busy) return;
    busy = true;
    send.disabled = true;
    history.push({
        role: "user",
        content: text.trim()
    });
    add("user", text.trim());
    const t = add("assistant", "Thinking…", false);
    t.querySelector(".bubble").classList.add("typing");
    try {
        const r = await fetch("functions/API/chat.js", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                messages: history
            })
        });
        const d = await r.json();
        if (!r.ok) throw Error(d.error || "Request failed");
        t.remove();
        history.push({
            role: "assistant",
            content: d.text
        });
        add("assistant", d.text, false);
        save();
    } catch (e) {
        t.remove();
        add("assistant", "⚠️ " + e.message, false)
    } finally {
        busy = false;
        send.disabled = false;
        input.focus()
    }
}
form.onsubmit = e => {
    e.preventDefault();
    let t = input.value;
    input.value = "";
    input.style.height = "auto";
    chat(t)
};
input.onkeydown = e => {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        form.requestSubmit()
    }
};
input.oninput = () => {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 180) + "px"
};
document.querySelectorAll(".suggestions button").forEach(b => b.onclick = () => {
    input.value = b.textContent;
    form.requestSubmit()
});
$("#newChat").onclick = () => {
    history = [];
    save();
    location.reload()
};
$("#clear").onclick = () => {
    history = [];
    save();
    location.reload()
};
$("#menu").onclick = () => $("#sidebar").classList.toggle("open");
load();
health();
input.focus();
