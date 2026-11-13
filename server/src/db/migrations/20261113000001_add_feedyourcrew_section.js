// The "Feed Your Crew" section (July 2026 redesign) was only added to the seed,
// which runs on an empty database. Databases seeded before that (= prod) never
// received it. Create it here, HIDDEN, right after "Approche": the editor
// reviews it in the back office and publishes it with the eye icon.

import { randomUUID } from 'node:crypto';
import { SITE_CONFIG } from '../seeds/seed_data.js';

export async function up(knex) {
  const sections = await knex('sections').select('id', 'type', 'order');
  if (sections.length === 0) return; // fresh DB: the seed will create everything
  if (sections.some((s) => s.type === 'feedyourcrew')) return;

  const approche = sections.find((s) => s.type === 'approche');
  const order = approche ? approche.order + 1 : Math.max(...sections.map((s) => s.order)) + 1;

  await knex('sections').where('order', '>=', order).increment('order', 1);
  await knex('sections').insert({
    id: randomUUID(),
    type: 'feedyourcrew',
    order,
    visible: 0,
    data_json: JSON.stringify(SITE_CONFIG.feedyourcrew),
  });
}

export async function down() {
  // Content migration: nothing to undo automatically (the editor may have
  // edited the section since). Delete it from the back office if needed.
}
