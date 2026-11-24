package io.github.angeloberardi.biginjapan;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.GeolocationPermissions;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

/** Contenitore a tutto schermo: apre il sito in una WebView, senza barra dell'indirizzo. */
public class MainActivity extends Activity {
    private static final String HOST = "angeloberardi.github.io";
    static final String URL = "https://" + HOST + "/big-in-japan/?app=android";
    static volatile boolean davanti = false;
    private WebView web;

    /** Ponte per il sito: notifiche, permesso, promemoria e impostazioni del controllo ad app chiusa. */
    private class Ponte {
        @JavascriptInterface public void notifica(String t, String b, String go) {
            Notifiche.mostra(MainActivity.this, Notifiche.ATTIVITA, (t + b).hashCode(), t, b, go);
        }
        @JavascriptInterface public String stato() {
            if (Notifiche.permesse(MainActivity.this)) return "granted";
            return Promemoria.pref(MainActivity.this).getBoolean("chiesto", false) ? "denied" : "default";
        }
        @JavascriptInterface public void permesso() {
            Promemoria.pref(MainActivity.this).edit().putBoolean("chiesto", true).apply();
            if (Build.VERSION.SDK_INT >= 33) runOnUiThread(() -> requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 2));
        }
        @JavascriptInterface public void programma(String json) { Promemoria.pianifica(MainActivity.this, json); }
        @JavascriptInterface public void config(String json) {
            Promemoria.pref(MainActivity.this).edit().putString("config", json).apply();
            Controllo.programma(MainActivity.this);
        }
        @JavascriptInterface public void visto(double t) {
            android.content.SharedPreferences p = Promemoria.pref(MainActivity.this);
            if ((long) t > p.getLong("visto", 0)) p.edit().putLong("visto", (long) t).apply();
        }
    }

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        Window w = getWindow();
        w.setStatusBarColor(Color.parseColor("#E2412B"));
        w.setNavigationBarColor(Color.parseColor("#E2412B"));
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setGeolocationEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        Notifiche.canali(this);
        web.addJavascriptInterface(new Ponte(), "BIJAndroid");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception e) { }
                return true;
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback cb) {
                cb.invoke(origin, true, false);
            }
        });
        if (Build.VERSION.SDK_INT >= 23 && checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED)
            requestPermissions(new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION}, 1);
        Uri in = getIntent().getData();
        web.loadUrl(in != null && HOST.equals(in.getHost()) ? in.toString() : URL);
    }

    @Override
    protected void onNewIntent(Intent i) {
        super.onNewIntent(i);
        Uri in = i.getData();
        if (in != null && HOST.equals(in.getHost())) web.loadUrl(in.toString());
    }

    @Override
    protected void onResume() { super.onResume(); davanti = true; Promemoria.pref(this).edit().putLong("visto", System.currentTimeMillis()).apply(); }

    @Override
    protected void onPause() { super.onPause(); davanti = false; Promemoria.pref(this).edit().putLong("visto", System.currentTimeMillis()).apply(); }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
