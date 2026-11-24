package io.github.angeloberardi.biginjapan;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;

/** Canali e costruzione delle notifiche; il tocco apre il sito con #n=<destinazione>. */
final class Notifiche {
    static final String ATTIVITA = "attivita", PROMEMORIA = "promemoria";

    static void canali(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = c.getSystemService(NotificationManager.class);
        NotificationChannel a = new NotificationChannel(ATTIVITA, "Attività del gruppo", NotificationManager.IMPORTANCE_DEFAULT);
        a.setDescription("Proposte, commenti, voti, programma, spese e diario");
        NotificationChannel p = new NotificationChannel(PROMEMORIA, "Promemoria del programma", NotificationManager.IMPORTANCE_HIGH);
        p.setDescription("Prima di ogni tappa e riepilogo del mattino");
        nm.createNotificationChannel(a);
        nm.createNotificationChannel(p);
    }

    static boolean permesse(Context c) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 24 && !nm.areNotificationsEnabled()) return false;
        return Build.VERSION.SDK_INT < 33 || c.checkSelfPermission("android.permission.POST_NOTIFICATIONS") == 0;
    }

    static void mostra(Context c, String canale, int id, String titolo, String testo, String go) {
        if (!permesse(c)) return;
        canali(c);
        Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(MainActivity.URL + "#n=" + Uri.encode(go == null ? "home" : go)), c, MainActivity.class);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, id, i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder b = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, canale) : new Notification.Builder(c);
        b.setSmallIcon(R.drawable.ic_notifica).setColor(Color.parseColor("#C73A24")).setContentTitle(titolo).setContentText(testo)
                .setStyle(new Notification.BigTextStyle().bigText(testo)).setAutoCancel(true).setContentIntent(pi)
                .setWhen(System.currentTimeMillis()).setShowWhen(true);
        if (Build.VERSION.SDK_INT < 26) b.setPriority(PROMEMORIA.equals(canale) ? Notification.PRIORITY_HIGH : Notification.PRIORITY_DEFAULT).setDefaults(Notification.DEFAULT_ALL);
        ((NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE)).notify(id, b.build());
    }
}
