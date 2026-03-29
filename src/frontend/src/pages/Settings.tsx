import { ExternalLink, Loader2, Settings as SettingsIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";
import { useBackend } from "../hooks/useBackend";

export default function Settings() {
  const { actor } = useBackend();
  const { user } = useAuth();
  const [webhookUrl, setWebhookUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!actor) return;
    actor
      .getDiscordWebhookUrl()
      .then((url) => {
        setWebhookUrl(url);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [actor]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actor || !user) return;
    setSaving(true);
    try {
      const res = await actor.setDiscordWebhookUrl(
        user.email,
        user.password,
        webhookUrl,
      );
      if (res.ok) toast.success("Webhook URL saved!");
      else toast.error(res.message);
    } catch {
      toast.error("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="flex items-center gap-3 mb-6 border-b border-border pb-4">
        <SettingsIcon className="w-6 h-6 text-primary" />
        <div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground text-xs tracking-wider">
            Application configuration
          </p>
        </div>
      </div>

      <div className="bg-card border border-border border-t-2 border-t-primary p-6 max-w-lg">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground mb-1">
          Discord Webhook
        </h2>
        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
          Paste your Discord channel webhook URL below to receive expiry alerts.
          Alerts are sent automatically when a member&apos;s rank expires within
          3 days.
          <a
            href="https://support.discord.com/hc/en-us/articles/228383668"
            target="_blank"
            rel="noreferrer"
            data-ocid="settings.link"
            className="ml-1 text-primary hover:text-accent inline-flex items-center gap-1 transition-colors"
          >
            How to create a webhook <ExternalLink className="w-3 h-3" />
          </a>
        </p>
        {loading ? (
          <div
            data-ocid="settings.loading_state"
            className="text-muted-foreground text-xs tracking-wider flex items-center gap-2"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            LOADING...
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="webhook-url"
                className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-1"
              >
                Webhook URL
              </label>
              <input
                id="webhook-url"
                type="url"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                data-ocid="settings.input"
                className="w-full bg-input text-foreground px-3 py-2 text-xs border border-border focus:border-primary focus:outline-none transition-colors"
                placeholder="https://discord.com/api/webhooks/..."
              />
            </div>
            <button
              type="submit"
              disabled={saving}
              data-ocid="settings.submit_button"
              className="flex items-center gap-2 bg-primary hover:bg-accent text-primary-foreground px-6 py-2 text-xs font-bold uppercase tracking-widest transition-colors disabled:opacity-50"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {saving ? "SAVING..." : "SAVE WEBHOOK"}
            </button>
          </form>
        )}
      </div>

      <footer className="mt-12 text-[10px] text-muted-foreground/50">
        &copy; {new Date().getFullYear()}. Built with &#10084; using{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          className="hover:text-primary transition-colors"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
