from django.db import migrations


def prefill_manifest(apps, schema_editor):
    MainPageContent = apps.get_model("core", "MainPageContent")

    # Pentru fiecare record (de obicei unul per Site), completăm doar câmpurile goale
    for obj in MainPageContent.objects.all():
        changed = False

        if not (obj.manifest_label or "").strip():
            obj.manifest_label = "( PROCESUL DE SELECȚIE )"
            changed = True

        if not (obj.manifest_title or "").strip():
            obj.manifest_title = "Accesul este limitat la\n12 membri pe sezon."
            changed = True

        if not (obj.manifest_text or "").strip():
            obj.manifest_text = (
                "Căutăm familii care înțeleg că educația estetică este o investiție pe viață.\n"
                "Nu vindem cursuri. Construim fundații artistice."
            )
            changed = True

        # (opțional) și cards-urile, dacă vrei să fie prefilled și ele:
        if not (obj.manifest_card_1_title or "").strip():
            obj.manifest_card_1_title = "Selecție atentă"
            changed = True
        if not (obj.manifest_card_1_text or "").strip():
            obj.manifest_card_1_text = "Discutăm cu părinții și înțelegem contextul copilului înainte de a confirma un loc."
            changed = True

        if not (obj.manifest_card_2_title or "").strip():
            obj.manifest_card_2_title = "Comunitate restrânsă"
            changed = True
        if not (obj.manifest_card_2_text or "").strip():
            obj.manifest_card_2_text = "Menținem un grup mic pentru dialog real cu mentorul și progres vizibil."
            changed = True

        if not (obj.manifest_card_3_title or "").strip():
            obj.manifest_card_3_title = "Invitație, nu înscriere"
            changed = True
        if not (obj.manifest_card_3_text or "").strip():
            obj.manifest_card_3_text = "Confirmarea se face prin invitație, în funcție de potrivirea cu valorile atelierelor."
            changed = True

        if changed:
            obj.save()


def noop_reverse(apps, schema_editor):
    # Nu facem rollback la conținut (safe)
    pass


class Migration(migrations.Migration):
    dependencies = [
        # ⚠️ schimbă asta pe ultima migrație reală din core, ex:
        # ("core", "0005_some_previous_migration"),
        ("core", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(prefill_manifest, noop_reverse),
    ]
