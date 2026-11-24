package io.github.angeloberardi.biginjapan;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

/** Promemoria del programma: allarmi di sistema, che suonano anche ad app chiusa. Riceve anche l'avvio del telefono. */
public class Promemoria extends BroadcastReceiver {
    static SharedPreferences pref(Context c) { return c.getSharedPreferences("bij", Context.MODE_PRIVATE); }

    static PendingIntent pi(Context c, int code, String id, String t, String b, String go, int flag) {
        Intent i = new Intent(c, Promemoria.class).setAction("io.github.angeloberardi.biginjapan.PROMEMORIA")
                .putExtra("id", id).putExtra("t", t).putExtra("b", b).putExtra("go", go);
        return PendingIntent.getBroadcast(c, code, i, flag | PendingIntent.FLAG_IMMUTABLE);
    }

    /** json: [{id,t,titolo,testo,go}], già ordinati e solo futuri */
    static synchronized void pianifica(Context c, String json) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences p = pref(c);
        try {
            JSONArray vecchi = new JSONArray(p.getString("codici", "[]"));
            for (int k = 0; k < vecchi.length(); k++) {
                PendingIntent v = pi(c, vecchi.getInt(k), "", "", "", "", PendingIntent.FLAG_NO_CREATE);
                if (v != null) { am.cancel(v); v.cancel(); }
            }
            JSONArray L = new JSONArray(json), codici = new JSONArray();
            long ora = System.currentTimeMillis();
            for (int k = 0; k < L.length() && codici.length() < 60; k++) {
                JSONObject o = L.getJSONObject(k);
                long t = o.getLong("t");
                if (t <= ora) continue;
                int code = 1000 + Math.abs(o.getString("id").hashCode() % 100000);
                PendingIntent x = pi(c, code, o.getString("id"), o.getString("titolo"), o.optString("testo"), o.optString("go", "home"), PendingIntent.FLAG_UPDATE_CURRENT);
                if (Build.VERSION.SDK_INT >= 23) am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, t, x);
                else am.set(AlarmManager.RTC_WAKEUP, t, x);
                codici.put(code);
            }
            p.edit().putString("codici", codici.toString()).putString("programma", json).apply();
        } catch (Exception e) { }
    }

    @Override
    public void onReceive(Context c, Intent i) {
        String a = i.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || "android.intent.action.MY_PACKAGE_REPLACED".equals(a)) {
            pianifica(c, pref(c).getString("programma", "[]"));
            Controllo.programma(c);
            return;
        }
        String id = i.getStringExtra("id");
        if (id == null) return;
        Notifiche.mostra(c, Notifiche.PROMEMORIA, id.hashCode(), i.getStringExtra("t"), i.getStringExtra("b"), i.getStringExtra("go"));
    }
}
