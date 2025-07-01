exports.up = (knex) => {
  return knex.schema.createTable('scan_history', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
    table.uuid('user_id').references('id').inTable('users').onDelete('CASCADE').index();
    table.text('image_url').notNullable();
    table.text('thumbnail_url');
    table.string('item_name', 255).notNullable();
    table.string('item_category', 100).index();
    table.string('item_brand', 100).index();
    table.text('item_description');
    table.text('condition_assessment');
    table.string('price_range', 50);
    table.jsonb('platform_prices').defaultTo('{}');
    table.integer('confidence_score').checkBetween([0, 100]);
    table.jsonb('ai_response');
    table.boolean('is_favorite').defaultTo(false).index();
    table.text('notes');
    table.timestamp('scanned_at').defaultTo(knex.fn.now()).index();
    table.timestamps(true, true);

    // Composite indexes
    table.index(['user_id', 'scanned_at']);
    table.index(['user_id', 'is_favorite']);
    table.index(['user_id', 'item_category']);
  });
};

exports.down = (knex) => {
  return knex.schema.dropTableIfExists('scan_history');
};