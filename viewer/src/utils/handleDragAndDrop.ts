export function handleDragAndDrop(callback: (url: string) => void | Promise<void>) {
  window.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  window.addEventListener('drop', async (event) => {
    event.preventDefault();

    const files = event.dataTransfer?.files;
    if (files == null) {
      return;
    }

    for (const file of files) {
      const url = URL.createObjectURL(file);
      try {
        await callback(url);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
  });
}
