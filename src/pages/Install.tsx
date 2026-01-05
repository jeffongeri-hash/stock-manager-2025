import React, { useState, useEffect } from 'react';
import { PageLayout } from '@/components/layout/PageLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Smartphone, Check, Share, MoreVertical, PlusSquare } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function Install() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    // Detect iOS
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(isIOSDevice);

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  return (
    <PageLayout title="Install App">
      <div className="max-w-2xl mx-auto space-y-6">
        {isInstalled ? (
          <Card className="border-green-500/50">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-500" />
              </div>
              <CardTitle>App Installed!</CardTitle>
              <CardDescription>
                Profit Pathway is already installed on your device. You can access it from your home screen.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <Smartphone className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Install Profit Pathway</CardTitle>
                <CardDescription>
                  Install this app on your device for quick access and a native app experience.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {deferredPrompt ? (
                  <Button onClick={handleInstall} className="w-full" size="lg">
                    <Download className="mr-2 h-5 w-5" />
                    Install App
                  </Button>
                ) : isIOS ? (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      To install on iOS:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Share className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">
                          1. Tap the <strong>Share</strong> button in Safari
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <PlusSquare className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">
                          2. Tap <strong>Add to Home Screen</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">
                          3. Tap <strong>Add</strong> to confirm
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground text-center">
                      To install on Android:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <MoreVertical className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">
                          1. Tap the <strong>menu</strong> button (⋮) in Chrome
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Download className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">
                          2. Tap <strong>Install app</strong> or <strong>Add to Home screen</strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                        <Check className="h-5 w-5 text-primary flex-shrink-0" />
                        <span className="text-sm">
                          3. Tap <strong>Install</strong> to confirm
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Benefits of Installing</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Quick access from your home screen</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Full-screen experience without browser UI</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Faster loading times</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Works offline for cached content</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageLayout>
  );
}
