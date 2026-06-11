import type { Attribute, Schema } from '@strapi/strapi';

export interface MoreInfoFlowerDetail extends Schema.Component {
  collectionName: 'components_more_info_flower_details';
  info: {
    displayName: 'FlowerDetail';
  };
  attributes: {
    Brand: Attribute.String;
    color: Attribute.String;
    componets: Attribute.Text;
    defends: Attribute.Text;
    diameters: Attribute.String;
    features: Attribute.Text;
    height: Attribute.String;
    macca: Attribute.String;
    place: Attribute.String;
    prime: Attribute.Text;
    say: Attribute.String;
    seedlings: Attribute.Text;
    sort: Attribute.Text;
    type: Attribute.Text;
  };
}

export interface MoreInfoGorshok extends Schema.Component {
  collectionName: 'components_more_info_gorshoks';
  info: {
    description: '';
    displayName: 'Gorshok';
  };
  attributes: {
    color: Attribute.String;
    diameters: Attribute.String;
    from: Attribute.String;
    height: Attribute.String;
    litrs: Attribute.String;
  };
}

export interface MoreInfoRassada extends Schema.Component {
  collectionName: 'components_more_info_rassadas';
  info: {
    displayName: 'Rassada';
  };
  attributes: {
    color: Attribute.String;
    from: Attribute.String;
    height: Attribute.String;
    lenght: Attribute.String;
    material: Attribute.String;
    widht: Attribute.String;
  };
}

declare module '@strapi/types' {
  export module Shared {
    export interface Components {
      'more-info.flower-detail': MoreInfoFlowerDetail;
      'more-info.gorshok': MoreInfoGorshok;
      'more-info.rassada': MoreInfoRassada;
    }
  }
}
