export type UploadTicket = { uploadUrl: string; uploadToken: string };

export function uploadBinary(ticket: UploadTicket, file: File, onProgress: (percent: number) => void) {
  return new Promise<{ id: string; fileName: string; sizeBytes: number; sha256: string; status: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", ticket.uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
    xhr.setRequestHeader("X-Upload-Token", ticket.uploadToken);
    xhr.setRequestHeader("X-File-Name", encodeURIComponent(file.name));
    xhr.upload.onprogress = (upload) => upload.lengthComputable && onProgress(Math.round((upload.loaded / upload.total) * 100));
    xhr.onload = () => {
      const data = JSON.parse(xhr.responseText || "{}");
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data.data);
      reject(new Error(data?.error?.message ?? "Téléversement impossible."));
    };
    xhr.onerror = () => reject(new Error("Connexion interrompue pendant l’envoi."));
    xhr.send(file);
  });
}