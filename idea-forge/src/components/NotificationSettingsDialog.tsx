import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Bell, Mail, MessageSquare, ThumbsUp, Activity } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";

interface NotificationSettingsProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NotificationSettingsDialog({ children, open, onOpenChange }: NotificationSettingsProps) {
  const { token, user } = useAuth();
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    email_enabled: true,
    push_enabled: true,
    notify_on_vote: true,
    notify_on_comment: true,
    notify_on_status_change: true,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if ((open || children) && token && user) {
      fetchSettings();
    }
  }, [open, token, user, children]);

  const fetchSettings = async () => {
    try {
      const data = await api.get("/users/notification-settings", token);
      if (data) {
        setSettings({
          email_enabled: data.email_enabled,
          push_enabled: data.push_enabled,
          notify_on_vote: data.notify_on_vote,
          notify_on_comment: data.notify_on_comment,
          notify_on_status_change: data.notify_on_status_change,
        });
      }
    } catch (error) {
      console.error("Failed to load notification settings", error);
    }
  };

  const handleToggle = async (key: keyof typeof settings) => {
    const newValue = !settings[key];
    setSettings((prev) => ({ ...prev, [key]: newValue }));
    
    try {
      await api.patch("/users/notification-settings", { [key]: newValue }, token);
      toast({
        title: "Settings updated",
        description: "Your notification preferences have been saved.",
      });
    } catch (error) {
      console.error("Failed to update setting", error);
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: !newValue }));
      toast({
        title: "Update failed",
        description: "Could not save your preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const content = (
    <DialogContent className="sm:max-w-[425px] bg-header border-white/10 text-white">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-primary" />
          Notification Settings
        </DialogTitle>
        <DialogDescription className="text-white/60">
          Manage how and when you want to be notified.
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-6">
        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Delivery Methods</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-white/70">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-white font-medium text-sm">Email Notifications</Label>
                <p className="text-[12px] text-white/50">Receive daily summaries and alerts</p>
              </div>
            </div>
            <Switch 
              checked={settings.email_enabled} 
              onCheckedChange={() => handleToggle('email_enabled')} 
              disabled={loading}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-white/70">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <Label className="text-white font-medium text-sm">Push Notifications</Label>
                <p className="text-[12px] text-white/50">Alerts delivered directly to your device</p>
              </div>
            </div>
            <Switch 
              checked={settings.push_enabled} 
              onCheckedChange={() => handleToggle('push_enabled')} 
              disabled={loading}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>

        <div className="h-px bg-white/10" />

        <div className="space-y-4">
          <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Events</h4>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-white/70">
                <ThumbsUp className="w-4 h-4" />
              </div>
              <Label className="text-white text-sm">Votes on my ideas</Label>
            </div>
            <Switch 
              checked={settings.notify_on_vote} 
              onCheckedChange={() => handleToggle('notify_on_vote')} 
              disabled={loading}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-white/70">
                <MessageSquare className="w-4 h-4" />
              </div>
              <Label className="text-white text-sm">Comments on my ideas</Label>
            </div>
            <Switch 
              checked={settings.notify_on_comment} 
              onCheckedChange={() => handleToggle('notify_on_comment')} 
              disabled={loading}
              className="data-[state=checked]:bg-primary"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-white/70">
                <Activity className="w-4 h-4" />
              </div>
              <Label className="text-white text-sm">Idea status changes</Label>
            </div>
            <Switch 
              checked={settings.notify_on_status_change} 
              onCheckedChange={() => handleToggle('notify_on_status_change')} 
              disabled={loading}
              className="data-[state=checked]:bg-primary"
            />
          </div>
        </div>
      </div>
    </DialogContent>
  );

  if (children) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
        {content}
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {content}
    </Dialog>
  );
}
