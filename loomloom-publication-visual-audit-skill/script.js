const copyButton = document.querySelector("#copyPrompt");
const promptText = document.querySelector("#installPrompt");

copyButton?.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(promptText.textContent.trim());
    copyButton.textContent = "已复制";
    window.setTimeout(() => {
      copyButton.textContent = "复制指令";
    }, 1800);
  } catch {
    copyButton.textContent = "请手动复制";
  }
});
