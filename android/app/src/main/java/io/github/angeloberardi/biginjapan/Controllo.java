package io.github.angeloberardi.biginjapan;

import android.app.job.JobInfo;
import android.app.job.JobParameters;
import android.app.job.JobScheduler;
import android.app.job.JobService;
import android.content.ComponentName;
import android.content.Context;
import android.content.SharedPreferences;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import org.json.JSONObject;

/** Ad app chiusa, circa ogni 15 minuti: legge le novità dal database (accesso anonimo, come il sito) e avvisa.
    Con l'app aperta non fa nulla: lì avvisa già il sito. */
public class Controllo extends JobService {
    private static final int JOB = 7;
    private static final String REF = "https://angeloberardi.github.io/";

    static void programma(Context c) {
        SharedPreferences p = Promemoria.pref(c);
        if (p.getString("config", null) == null) return;
        JobScheduler js = (JobScheduler) c.getSystemService(Context.JOB_SCHEDULER_SERVICE);
        if (js.getPendingJob(JOB) != null) return;
        js.schedule(new JobInfo.Builder(JOB, new ComponentName(c, Controllo.class))
                .setPeriodic(15 * 60 * 1000L).setRequiredNetworkType(JobInfo.NETWORK_TYPE_ANY).setPersisted(true).build());
    }

    @Override
    public boolean onStartJob(JobParameters jp) {
        if (MainActivity.davanti) return false;
        new Thread(() -> {
            try { controlla(getApplicationContext()); } catch (Exception e) { }
            jobFinished(jp, false);
        }).start();
        return true;
    }

    @Override
    public boolean onStopJob(JobParameters jp) { return true; }

    private static String http(String metodo, String url, String tipo, String corpo) throws Exception {
        HttpURLConnection h = (HttpURLConnection) new URL(url).openConnection();
        h.setRequestMethod(metodo);
        h.setConnectTimeout(15000);
        h.setReadTimeout(20000);
        h.setRequestProperty("Referer", REF);
        if (corpo != null) {
            h.setDoOutput(true);
            h.setRequestProperty("Content-Type", tipo);
            try (OutputStream o = h.getOutputStream()) { o.write(corpo.getBytes("UTF-8")); }
        }
        if (h.getResponseCode() >= 300) throw new Exception("HTTP " + h.getResponseCode());
        try (InputStream in = h.getInputStream()) {
            ByteArrayOutputStream b = new ByteArrayOutputStream();
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
            return b.toString("UTF-8");
        }
    }

    /** token di accesso anonimo, rinnovato quando scade */
    private static String token(SharedPreferences p, String apiKey) throws Exception {
        long scade = p.getLong("scade", 0);
        String id = p.getString("idToken", null), rt = p.getString("refresh", null);
        if (id != null && System.currentTimeMillis() < scade - 120000) return id;
        JSONObject r;
        if (rt != null) {
            try {
                r = new JSONObject(http("POST", "https://securetoken.googleapis.com/v1/token?key=" + apiKey, "application/x-www-form-urlencoded",
                        "grant_type=refresh_token&refresh_token=" + URLEncoder.encode(rt, "UTF-8")));
                p.edit().putString("idToken", r.getString("id_token")).putString("refresh", r.getString("refresh_token"))
                        .putLong("scade", System.currentTimeMillis() + Long.parseLong(r.optString("expires_in", "3600")) * 1000).apply();
                return r.getString("id_token");
            } catch (Exception e) { }
        }
        r = new JSONObject(http("POST", "https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + apiKey, "application/json", "{\"returnSecureToken\":true}"));
        p.edit().putString("idToken", r.getString("idToken")).putString("refresh", r.getString("refreshToken"))
                .putLong("scade", System.currentTimeMillis() + Long.parseLong(r.optString("expiresIn", "3600")) * 1000).apply();
        return r.getString("idToken");
    }

    private static JSONObject leggi(String base, String nodo, String tok) {
        try {
            String s = http("GET", base + nodo + ".json?auth=" + URLEncoder.encode(tok, "UTF-8"), null, null);
            return s == null || s.trim().equals("null") ? new JSONObject() : new JSONObject(s);
        } catch (Exception e) { return new JSONObject(); }
    }

    private static Iterable<String> chiavi(JSONObject o) {
        List<String> l = new ArrayList<>();
        for (Iterator<String> it = o.keys(); it.hasNext(); ) l.add(it.next());
        return l;
    }

    static void controlla(Context c) throws Exception {
        SharedPreferences p = Promemoria.pref(c);
        JSONObject cfg = new JSONObject(p.getString("config", "{}")), pref = cfg.optJSONObject("pref");
        if (pref == null) pref = new JSONObject();
        String io = cfg.optString("nome", ""), key = cfg.optString("key", ""), apiKey = cfg.optString("apiKey", ""), db = cfg.optString("db", "");
        if (io.isEmpty() || key.isEmpty() || !Notifiche.permesse(c)) return;
        long da = Math.max(p.getLong("visto", 0), p.getLong("controllo", 0));
        if (da == 0) da = System.currentTimeMillis();
        String tok = token(p, apiKey), base = db + "/viaggi/" + key + "/";
        int h = java.util.Calendar.getInstance().get(java.util.Calendar.HOUR_OF_DAY);
        boolean zitto = pref.optBoolean("silenzio", true) && (h >= 23 || h < 8);
        List<String[]> nuovi = new ArrayList<>();
        long max = da;
        JSONObject prop = leggi(base, "proposte", tok), com = leggi(base, "commenti", tok);
        Set<String> mie = new HashSet<>(), dove = new HashSet<>();
        java.util.Map<String, String> titoli = new java.util.HashMap<>();
        for (String g : chiavi(prop)) {
            JSONObject o = prop.optJSONObject(g);
            if (o == null) continue;
            for (String id : chiavi(o)) {
                JSONObject x = o.optJSONObject(id);
                if (x == null) continue;
                titoli.put(id, x.optString("titolo"));
                if (io.equals(x.optString("autore"))) mie.add(id);
                long t = x.optLong("t");
                if (t > da && !io.equals(x.optString("autore")) && pref.optBoolean("proposte", true))
                    nuovi.add(new String[]{x.optString("autore") + " ha proposto «" + x.optString("titolo") + "»", "Tocca per aprire la proposta", "p/" + g + "/" + id, "" + t});
                max = Math.max(max, t);
            }
        }
        String modo = pref.optString("commenti", "tutti");
        for (String id : chiavi(com)) {
            JSONObject o = com.optJSONObject(id);
            if (o == null) continue;
            for (String k : chiavi(o)) { JSONObject x = o.optJSONObject(k); if (x != null && io.equals(x.optString("autore"))) dove.add(id); }
        }
        for (String id : chiavi(com)) {
            JSONObject o = com.optJSONObject(id);
            if (o == null) continue;
            for (String k : chiavi(o)) {
                JSONObject x = o.optJSONObject(k);
                if (x == null) continue;
                long t = x.optLong("t");
                max = Math.max(max, t);
                boolean mio = mie.contains(id) || dove.contains(id);
                if (t > da && !io.equals(x.optString("autore")) && ("tutti".equals(modo) || ("miei".equals(modo) && mio))) {
                    String tit = titoli.get(id);
                    nuovi.add(new String[]{x.optString("autore") + " ha commentato" + (tit != null ? " «" + tit + "»" : ""), x.optString("testo"),
                            titoli.containsKey(id) ? "p/" + trovaGiorno(prop, id) + "/" + id : "home", "" + t});
                }
            }
        }
        if (pref.optBoolean("spese", true)) {
            JSONObject spe = leggi(base, "spese", tok);
            for (String k : chiavi(spe)) {
                JSONObject x = spe.optJSONObject(k);
                if (x == null) continue;
                long t = x.optLong("t");
                JSONObject per = x.optJSONObject("per");
                boolean mia = io.equals(x.optString("paga")) || (per != null && per.has(io) && ("uguale".equals(x.optString("modo")) || per.optDouble(io, 0) > 0));
                if (t > da && mia && !io.equals(x.optString("autore")))
                    nuovi.add(new String[]{x.optString("autore") + " ha aggiunto «" + x.optString("titolo") + "»", "Una spesa che ti riguarda", "spese", "" + t});
                max = Math.max(max, t);
            }
        }
        if (pref.optBoolean("diario", true)) {
            JSONObject dia = leggi(base, "diario", tok);
            for (String k : chiavi(dia)) {
                JSONObject x = dia.optJSONObject(k);
                if (x == null) continue;
                long t = x.optLong("t");
                if (t > da && !io.equals(x.optString("autore")))
                    nuovi.add(new String[]{x.optString("autore") + " ha scritto nel diario", x.optString("testo"), "home", "" + t});
                max = Math.max(max, t);
            }
        }
        if (pref.optBoolean("programma", true)) {
            JSONObject mod = leggi(base, "modifiche", tok);
            for (String k : chiavi(mod)) {
                JSONObject x = mod.optJSONObject(k);
                if (x == null) continue;
                long t = x.optLong("t");
                if (t > da && x.has("autore") && !io.equals(x.optString("autore")))
                    nuovi.add(new String[]{x.optString("autore") + (x.optBoolean("nascosto") ? " ha tolto una tappa" : " ha cambiato il programma"), x.has("ora") ? "Nuovo orario: " + x.optString("ora") : "Tocca per vedere il programma", "home", "" + t});
                max = Math.max(max, t);
            }
        }
        p.edit().putLong("controllo", Math.max(max, da)).apply();
        if (zitto || nuovi.isEmpty()) return;
        if (nuovi.size() > 3) {
            StringBuilder sb = new StringBuilder();
            for (int k = 0; k < nuovi.size() && k < 6; k++) sb.append(k > 0 ? "\n" : "").append(nuovi.get(k)[0]);
            Notifiche.mostra(c, Notifiche.ATTIVITA, 77, nuovi.size() + " novità nel viaggio", sb.toString(), "home");
        } else for (String[] n : nuovi) Notifiche.mostra(c, Notifiche.ATTIVITA, (n[2] + n[3]).hashCode(), n[0], n[1], n[2]);
    }

    private static String trovaGiorno(JSONObject prop, String id) {
        for (String g : chiavi(prop)) { JSONObject o = prop.optJSONObject(g); if (o != null && o.has(id)) return g; }
        return "";
    }
}
