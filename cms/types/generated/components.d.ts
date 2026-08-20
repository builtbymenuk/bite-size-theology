import type { Schema, Struct } from '@strapi/strapi';

export interface SharedEpisode extends Struct.ComponentSchema {
  collectionName: 'components_shared_episodes';
  info: {
    displayName: 'episode';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    title: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedFaqItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_faq_items';
  info: {
    displayName: 'faq-item';
  };
  attributes: {
    a: Schema.Attribute.Text;
    q: Schema.Attribute.Text;
  };
}

export interface SharedFooterColumn extends Struct.ComponentSchema {
  collectionName: 'components_shared_footer_columns';
  info: {
    displayName: 'footer-column';
  };
  attributes: {
    links: Schema.Attribute.Component<'shared.link', true>;
    title: Schema.Attribute.String;
  };
}

export interface SharedLink extends Struct.ComponentSchema {
  collectionName: 'components_shared_links';
  info: {
    displayName: 'link';
  };
  attributes: {
    label: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedPodcastAction extends Struct.ComponentSchema {
  collectionName: 'components_shared_podcast_actions';
  info: {
    displayName: 'podcast-action';
  };
  attributes: {
    label: Schema.Attribute.String;
    platform: Schema.Attribute.Enumeration<['spotify', 'youtube']>;
    url: Schema.Attribute.String;
  };
}

export interface SharedProduct extends Struct.ComponentSchema {
  collectionName: 'components_shared_products';
  info: {
    displayName: 'product';
  };
  attributes: {
    image: Schema.Attribute.Media<'images'>;
    name: Schema.Attribute.String;
    price: Schema.Attribute.String;
    tag: Schema.Attribute.String;
    tone: Schema.Attribute.Enumeration<
      ['dark', 'warm', 'light', 'cool', 'gold', 'yellow']
    >;
    url: Schema.Attribute.String;
  };
}

export interface SharedSeries extends Struct.ComponentSchema {
  collectionName: 'components_shared_series';
  info: {
    displayName: 'series';
  };
  attributes: {
    note: Schema.Attribute.String;
    playlist: Schema.Attribute.String;
    title: Schema.Attribute.String;
    video: Schema.Attribute.String;
  };
}

export interface SharedSocial extends Struct.ComponentSchema {
  collectionName: 'components_shared_socials';
  info: {
    displayName: 'social';
  };
  attributes: {
    handle: Schema.Attribute.String;
    name: Schema.Attribute.String;
    url: Schema.Attribute.String;
  };
}

export interface SharedStat extends Struct.ComponentSchema {
  collectionName: 'components_shared_stats';
  info: {
    displayName: 'stat';
  };
  attributes: {
    icon: Schema.Attribute.Enumeration<['mic', 'globe', 'award']>;
    label: Schema.Attribute.String;
    value: Schema.Attribute.String;
  };
}

export interface SharedTextItem extends Struct.ComponentSchema {
  collectionName: 'components_shared_text_items';
  info: {
    displayName: 'text-item';
  };
  attributes: {
    value: Schema.Attribute.Text;
  };
}

export interface SharedTourDate extends Struct.ComponentSchema {
  collectionName: 'components_shared_tour_dates';
  info: {
    displayName: 'tour-date';
  };
  attributes: {
    city: Schema.Attribute.String;
    date: Schema.Attribute.String;
    soldOut: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    url: Schema.Attribute.String;
    venue: Schema.Attribute.String;
  };
}

export interface SharedTourRegion extends Struct.ComponentSchema {
  collectionName: 'components_shared_tour_regions';
  info: {
    displayName: 'tour-region';
  };
  attributes: {
    code: Schema.Attribute.String;
    dates: Schema.Attribute.Component<'shared.tour-date', true>;
    eyebrow: Schema.Attribute.String;
    heading: Schema.Attribute.String;
    regionId: Schema.Attribute.String;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'shared.episode': SharedEpisode;
      'shared.faq-item': SharedFaqItem;
      'shared.footer-column': SharedFooterColumn;
      'shared.link': SharedLink;
      'shared.podcast-action': SharedPodcastAction;
      'shared.product': SharedProduct;
      'shared.series': SharedSeries;
      'shared.social': SharedSocial;
      'shared.stat': SharedStat;
      'shared.text-item': SharedTextItem;
      'shared.tour-date': SharedTourDate;
      'shared.tour-region': SharedTourRegion;
    }
  }
}
