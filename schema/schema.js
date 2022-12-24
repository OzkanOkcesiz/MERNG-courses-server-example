const Kurs = require("../models/Kurs");
const Egitmen = require("../models/Egitmen");
const Yetkili = require("../models/Yetkili");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const {
  GraphQLObjectType,
  GraphQLID,
  GraphQLString,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
  GraphQLEnumType,
  GraphQLError,
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
        return Egitmen.findById(parent.egitmenId);
      },
    },
  }),
});

const YetkiliType = new GraphQLObjectType({
  name: "Yetkili",
  fields: () => ({
    id: { type: GraphQLID },
    email: { type: GraphQLString },
    parola: { type: GraphQLString },
    token: { type: GraphQLString },
  }),
});

const RootQuery = new GraphQLObjectType({
  name: "Queries",
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
    yetkili: {
      type: YetkiliType,
      args: { id: { type: GraphQLID } },
      resolve(parent, args) {
        return Yetkili.findById(args.id);
      },
    },
  },
});

const RootMutation = new GraphQLObjectType({
  name: "Mutations",
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
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, args) {
        return Egitmen.findByIdAndRemove(args.id);
      },
    },
    kursEkle: {
      type: KursType,
      args: {
        isim: { type: new GraphQLNonNull(GraphQLString) },
        aciklama: { type: new GraphQLNonNull(GraphQLString) },
        durum: {
          type: new GraphQLEnumType({
            name: "KursDurumlar",
            values: {
              yayin: { value: "yayinda" },
              olus: { value: "oluşturuluyor" },
              plan: { value: "planlaniyor" },
            },
          }),
          defaultValue: "planlaniyor",
        },
        egitmenId: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, args) {
        const kurs = new Kurs({
          isim: args.isim,
          aciklama: args.aciklama,
          durum: args.durum,
          egitmenId: args.egitmenId,
        });
        return kurs.save();
      },
    },
    kursSil: {
      type: KursType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
      },
      resolve(parent, args) {
        return Kurs.findByIdAndRemove(args.id);
      },
    },
    kursGuncelle: {
      type: KursType,
      args: {
        id: { type: new GraphQLNonNull(GraphQLID) },
        isim: { type: GraphQLString },
        aciklama: { type: GraphQLString },
        durum: {
          type: new GraphQLEnumType({
            name: "KursGuncellemeDurumlar",
            values: {
              yayin: { value: "yayinda" },
              olus: { value: "oluşturuluyor" },
              plan: { value: "planlaniyor" },
            },
          }),
        },
      },
      resolve(parent, args) {
        return Kurs.findByIdAndUpdate(
          args.id,
          {
            $set: {
              isim: args.isim,
              aciklama: args.aciklama,
              durum: args.durum,
            },
          },
          { new: true }
        );
      },
    },
    yetkiliEkle: {
      type: YetkiliType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        parola: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const yetkili = new Yetkili({
          email: args.email,
          parola: args.parola,
        });

        const res = await yetkili.save();

        const token = jwt.sign(
          {
            id: res.id,
          },
          "aos-secret",
          { expiresIn: "2h" }
        );

        return {
          ...res._doc,
          id: res._id,
          token,
        };
      },
    },
    yetkiliGiris: {
      type: YetkiliType,
      args: {
        email: { type: new GraphQLNonNull(GraphQLString) },
        parola: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parent, args) {
        const email = args.email;

        const yetkili = await Yetkili.findOne({ email });

        if (yetkili) {
          const sonuc = await bcrypt.compare(args.parola, yetkili.parola);

          if (sonuc) {
            const token = jwt.sign(
              {
                id: yetkili.id,
              },
              "aos-secret",
              { expiresIn: "2h" }
            );
            return {
              ...yetkili._doc,
              id: yetkili._id,
              token,
            };
          }

          throw new GraphQLError("Parola Yanlış");
        }

        throw new GraphQLError('Yetkili Bulunamadı')
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation: RootMutation,
});
