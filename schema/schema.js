const { kurslar, egitmenler } = require("../db");

const Kurs = require("../models/Kurs");
const Egitmen = require("../models/Egitmen");

const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} = require("graphql");

const EgitmenType = new GraphQLObjectType({
  name: "Egitmen",
  fields: () => ({
    id: { type: GraphQLID },
    isim: { type: GraphQLString },
    email: { type: GraphQLString },
  }),
});

const KursType = new GraphQLObjectType({
  name: "Kurs",
  fields: () => ({
    id: { type: GraphQLID },
    isim: { type: GraphQLString },
    aciklama: { type: GraphQLString },
    durum: { type: GraphQLString },
    egitmen: {
      type: EgitmenType,
      resolve(parent, args) {
        return Egitmen.findById(parent.id);
      },
    },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "RootQueryType",
  fields: {
    egitmen: {
      type: EgitmenType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Egitmen.findById(args);
      },
    },
    egitmenler: {
      type: new GraphQLList(EgitmenType),
      resolve(parent, args) {
        return Egitmen.find();
      },
    },
    kurs: {
      type: KursType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Kurs.findById(args.id);
      },
    },
    kurslar: {
      type: new GraphQLList(KursType),
      resolve(parent, args) {
        return Kurs.find();
      },
    },
  },
});

const RootMutation = new GraphQLObjectType({
  name: "Mutation",
  fields: {
    egitmenEkle: {
      type: EgitmenType,
      args: {
        isim: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve(parent, args) {
        const egitmen = new Egitmen({
          isim: args.isim,
          email: args.email,
        });

        return egitmen.save();
      },
    },
    egitmenSil: {
      type: EgitmenType,
      args: {
        id: {type: new GraphQLNonNull(GraphQLID)}
      },
      resolve(parent,args) {
        return Egitmen.findByIdAndRemove(args.id);
      }
    }
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation,
});
