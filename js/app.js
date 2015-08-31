(function ($) {
 
    var contacts = [
        { name: "Contact 1", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: ['family'] },
        { name: "Contact 2", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: ['friend'] },
        { name: "Contact 3", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: ['colleague'] },
        { name: "Contact 4", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com"},
        { name: "Contact 5", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com", type: ['friend'] },
        { name: "Contact 6", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com"},
        { name: "Contact 7", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com"},
        { name: "Contact 8", address: "1, a street, a town, a city, AB12 3CD", tel: "0123456789", email: "anemail@me.com"}
    ];

    var Contact = Backbone.Model.extend({
        defaults: {
            photo: "../img/profile.png",
            name: "",
            address: "",
            tel: "",
            email: "",
            type: ['none']
        }

    });
    var Directory = Backbone.Collection.extend({
        model: Contact
    });

    var ContactView = Backbone.View.extend({
        tagName: 'article',
        className: 'contact-container',
        template: $('#contactTemplate').html(),
        editTemplate: _.template($("#contactEditTemplate").html()),

        render: function(){
            var tmpl = _.template(this.template);
            this.$el.html(tmpl(this.model.toJSON()));
            return this;
        },

        events: {
            "click button.delete": "deleteContact",
            "click button.edit": "editContact",
            "click button.save": "saveEdits",
            "click button.cancel": "cancelEdit",
            "change select.type": "addType",
            "click button.addToGroup": "showSelectGroup",
            "click #confirmAdd": "addToGroup"
        },

        deleteContact: function(){
            var removedType = this.model.get('type');
            this.model.destroy();
            this.remove();

            if(_.indexOf(this.getTypes, removedType) === -1){
                this.$el.find('#filter').find('select').children("[value='" + removedType + "']").remove();
            }
        },

        editContact: function(){
            this.$el.html(this.editTemplate(this.model.toJSON()));

            var newOpt = $('<option/>', {
                html: '<em>Add new..</em>',
                value: 'addType'
            });
            this.select = directory.createSelect().addClass('type').val(this.$el.find('#type').val()).append(newOpt).insertAfter(this.$el.find(".name"));
            this.$el.find('input[type="hidden"]').remove();

        },
        addType: function(){
            if (this.select.val() === 'addType'){
                this.select.remove();

                $('<input/>', {
                    'class': 'type'
                }).insertAfter(this.$el.find('.name')).focus();
            }
        },


        saveEdits: function(e){
            e.preventDefault();
            console.log('save');

            var newFormData = {};
            var prev = this.model.previousAttributes();

            // get formData
            $(e.target).closest('form').find(':input').not('button').each(function() {
                var el = $(this);
                newFormData[el.attr('class')] = el.val();
            });

            //use default photo if none supplied
            if (newFormData.photo === ""){
                delete newFormData.photo;
            }

            // update the model
            this.model.set(newFormData);

            // render View
            this.render();

            //if model acquired default photo property, remove it Check this!
             if (prev.photo === "/img/placeholder.png") {
                delete prev.photo;
            }

            // update contacts array
            _.each(contacts, function (contact) {
                if (_.isEqual(contact, prev)){
                    contacts.splice(_.indexOf(contacts, contacts), 1, newFormData);
                }
            });

            if (this.select.val() === "addType"){
                $(directory.el).find("#filter").find("select").remove().end().append(directory.createSelect());
            }
        },

        cancelEdit: function(){
            this.render();

        },

        showSelectGroup: function(){
            directory.createSelect().addClass('selectedGroup').insertAfter(this.$el.find(".addToGroup"));
            this.$el.find('#confirmAdd').slideToggle();

        },

        addToGroup: function(){
            var selectedGroup = this.$el.find(".selectedGroup").val();
            console.log(selectedGroup);

            // var _units = this.model.get('units');
            // _units.push($('#addUnit').val());
            // this.model.set({ 'units' : _units });

            var types = this.model.get('type');
            types.push(selectedGroup);
            this.model.set({'type': types})
            this.render();

        }

    });

    var DirectoryView = Backbone.View.extend({
        el: $("#contacts"),

        initialize: function(){
            this.collection = new Directory(contacts);

            this.render();
            this.$el.find('#filter').append(this.createSelect());

            this.on('change:filterType', this.filterByType, this);
            this.collection.on('reset', this.render, this);
            this.collection.on('add', this.renderContact, this);
            this.collection.on('remove', this.removeContact, this);

        },

        render: function(){
            this.$el.find("article").remove();

            var that = this;
            _.each(this.collection.models, function(item){
                that.renderContact(item);
            }, this)
        },
        renderContact: function(item){
            var contactView = new ContactView({
                model: item
            });
            this.$el.append(contactView.render().el);
        },

        getTypes: function(){
            return _.uniq(this.collection.pluck('type'), false, function (type){
                return type
            });
        },
        createSelect: function(){
            var filter = this.$el.find('#filter'),
            select = $('<select/>', {
                html: '<option value="all">All</option>'
            });
            _.each(this.getTypes(), function (item){
                var option = $('<option/>', {
                    value: item,
                    text: item
                }).appendTo(select);
            });
            return select;
        },


        events: {
            'change #filter select': 'setFilter',
            'click #add': 'addContact',
            'click #showForm': 'showForm'
        },

        setFilter: function(e){
            this.filterType = e.currentTarget.value;
            this.trigger('change:filterType');

        },


        filterByType: function(){
            if(this.filterType === 'all'){
                this.collection.reset(contacts);
                contactsRouter.navigate("filter/all");

            }
            else {
                this.collection.reset(contacts, {silent: true});

                var filterType = this.filterType,
                filtered = _.filter(this.collection.models, function(item){
                    return item.get('type') === filterType;
                });

                this.collection.reset(filtered);
                contactsRouter.navigate("filter/" + filterType);
            }
        },
        addContact: function(e){
            e.preventDefault();
            this.collection.reset(contacts, { silent: true });
            var formData = {};
            $('#addContact').children('input').each(function(i, el){
                if($(el).val() !== ''){
                    formData[el.id] = $(el).val();
                }
            });
            contacts.push(formData);

            if(_.indexOf(this.getTypes(), formData.type) === -1){
                this.collection.add(new Contact(formData));
                this.$el.find('#filter').find('select').remove().end().append(this.createSelect());
            } else {
                this.collection.add(new Contact(formData));
            }
        },

        // Removing the Model's Data
        removeContact: function(removedModel){
            var removed = removedModel.attributes;
            if (removed.photo === "/img/profile.png") {
                delete removed.photo;
            }
            _.each(contacts, function(contact){
                if(_.isEqual(contact, removed)){
                    contacts.splice(_.indexOf(contacts, contact), 1);
                }
            });
        },
        showForm: function(){
            this.$el.find('#addContact').slideToggle();
        }
    });

    var ContactsRouter = Backbone.Router.extend({
        routes: {
            'filter/:type': 'urlFilter'
        },
        urlFilter: function(type){
            directory.filterType = type;
            directory.trigger('change:filterType');
        }
    });
    var directory = new DirectoryView();

    var contactsRouter = new ContactsRouter();
    Backbone.history.start();


 
} (jQuery));