import { useState } from "react";
import { supabase } from "./supabase";

const CLOUD_NAME = "pw2e2su7";
const UPLOAD_PRESET = "earno_videos";

export default function VideoUpload({ user, onUploadComplete }) {
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleUpload = async () => {
    if (!file || !title) {
      setError("Tanpri mete tit ak videyo a!");
      return;
    }
    setUploading(true);
    setError("");
    setProgress(0);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", UPLOAD_PRESET);
      formData.append("cloud_name", CLOUD_NAME);

      const xhr = new XMLHttpRequest();
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      const uploadResult = await new Promise((resolve, reject) => {
        xhr.open("POST", `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/video/upload`);
        xhr.onload = () => resolve(JSON.parse(xhr.responseText));
        xhr.onerror = () => reject(new Error("Upload failed"));
        xhr.send(formData);
      });

      if (uploadResult.error) throw new Error(uploadResult.error.message);

      const { error: dbError } = await supabase.from("videos").insert([{
        user_id: user?.id || "anonymous",
        creator_name: user?.name || "Anonymous",
        title: title,
        description: description,
        video_url: uploadResult.secure_url,
        thumbnail_url: uploadResult.secure_url.replace("/upload/", "/upload/so_0/"),
        duration: Math.round(uploadResult.duration || 0),
        likes: 0,
        views: 0,
        points_earned: 0,
      }]);

      if (dbError) throw dbError;

      setSuccess(true);
      setFile(null);
      setTitle("");
      setDescription("");
      setProgress(0);
      if (onUploadComplete) onUploadComplete();

    } catch (err) {
      setError(err.message || "Erè pandan upload la");
    }
    setUploading(false);
  };

  const inputStyle = {
    width: "100%", padding: "14px", borderRadius: "10px", border: "1px solid #333",
    background: "#1a1a1a", color: "white", fontSize: "16px", marginBottom: "14px",
    boxSizing: "border-box"
  };

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto", padding: "20px" }}>
      <h2 style={{ color: "#FFD700", marginBottom: "20px", textAlign: "center" }}>
        📹 Upload Video
      </h2>

      {success && (
        <div style={{ background: "#00ff0022", border: "1px solid #00ff00", borderRadius: "10px", padding: "16px", marginBottom: "16px", color: "#00ff00", textAlign: "center" }}>
          ✅ Video uploade avèk siksè! +5 pwen kreyatè!
        </div>
      )}

      {error && (
        <div style={{ background: "#ff000022", border: "1px solid #ff4444", borderRadius: "10px", padding: "16px", marginBottom: "16px", color: "#ff4444" }}>
          {error}
        </div>
      )}

      <div style={{ background: "#1a1a1a", border: "2px dashed #333", borderRadius: "16px", padding: "30px", textAlign: "center", marginBottom: "20px", cursor: "pointer" }}
        onClick={() => document.getElementById("videoInput").click()}>
        {file ? (
          <div>
            <div style={{ fontSize: "48px" }}>🎬</div>
            <p style={{ color: "#FFD700", fontWeight: "700", margin: "10px 0 4px" }}>{file.name}</p>
            <p style={{ color: "#888", fontSize: "13px" }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: "48px" }}>📹</div>
            <p style={{ color: "#aaa", margin: "10px 0 4px" }}>Klike pou chwazi videyo ou</p>
            <p style={{ color: "#888", fontSize: "13px" }}>MP4, MOV, AVI — maks 100MB</p>
          </div>
        )}
        <input id="videoInput" type="file" accept="video/*" style={{ display: "none" }}
          onChange={e => { setFile(e.target.files[0]); setSuccess(false); }} />
      </div>

      <input placeholder="Tit videyo ou a *" style={inputStyle} value={title}
        onChange={e => setTitle(e.target.value)} />

      <textarea placeholder="Deskripsyon (opsyonèl)..." style={{ ...inputStyle, height: "100px", resize: "vertical" }}
        value={description} onChange={e => setDescription(e.target.value)} />

      {uploading && (
        <div style={{ marginBottom: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
            <span style={{ color: "#aaa", fontSize: "14px" }}>Ap upload...</span>
            <span style={{ color: "#FFD700", fontWeight: "700" }}>{progress}%</span>
          </div>
          <div style={{ background: "#222", borderRadius: "10px", height: "8px" }}>
            <div style={{ background: "linear-gradient(135deg, #FFD700, #FFA500)", height: "100%", borderRadius: "10px", width: `${progress}%`, transition: "width 0.3s" }} />
          </div>
        </div>
      )}

      <button onClick={handleUpload} disabled={uploading || !file || !title}
        style={{ width: "100%", padding: "16px", background: uploading || !file || !title ? "#333" : "linear-gradient(135deg, #FFD700, #FFA500)", border: "none", borderRadius: "10px", fontWeight: "700", fontSize: "16px", cursor: uploading || !file || !title ? "not-allowed" : "pointer", color: uploading || !file || !title ? "#666" : "#000" }}>
        {uploading ? `Ap upload... ${progress}%` : "🚀 Poste Video"}
      </button>

      <p style={{ color: "#888", fontSize: "12px", textAlign: "center", marginTop: "12px" }}>
        Chak video ou poste = +5 pwen pou ou!
      </p>
    </div>
  );
}