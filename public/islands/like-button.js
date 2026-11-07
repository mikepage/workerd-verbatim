// Upgrades the server-rendered <like-button>. Without JS the button stays disabled.
class LikeButton extends HTMLElement {
  connectedCallback() {
    const button = this.querySelector("button");
    const slug = this.getAttribute("slug");
    if (!button || !slug) return;
    button.disabled = false;
    button.addEventListener("click", async () => {
      button.disabled = true;
      const res = await fetch(`/api/likes/${encodeURIComponent(slug)}`, { method: "POST" });
      const { count } = await res.json();
      button.textContent = `Like (${count})`;
      button.disabled = false;
    });
  }
}

customElements.define("like-button", LikeButton);
