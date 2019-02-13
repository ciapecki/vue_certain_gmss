<template>
   <form @submit.prevent="sendFile" enctype="multipart/form-data">

        <div v-if="message"
            :class="`message ${error ? 'is-danger' : 'is-success'}`" 
        >
        <div class="message-body">{{ message }}</div>

        </div>


        <div v-if="legacySystemHTML" class="legacySystemHTML" v-html="legacySystemHTML">
        </div>

        <div class="field">

            <div class="file is-boxed is-primary">
                <label class="file-label">

                    <input
                        type="file"
                        ref="file"
                        @change="selectFile"
                        class="file-input"
                    />

                    <span class="file-cta">
                        <span class="file-icon">
                            <i class="fas fa-upload"></i>
                        </span>
                        <span class="file-label">
                            Choose a  file...
                        </span>
                    </span>


                    <span v-if="file" class="file-name">{{file.name}}</span>
                </label>
                
            </div>


        </div>

        <div class="field">
            <button class="button is-info">Send</button>
        </div>

<!--
        <div class="content">
            <ul>
                <li v-for="file in uploadedFiles" :key="file.originalname">
                    {{ file.originalname }}
                </li>
            </ul>
        </div>
-->

   </form> 
</template>

<script>
import axios from 'axios';

//function url (str) {
//  return str.replace(/\s+/g, '-')
//}

//Vue.prototype.url = url;

export default {
    name: "SimpleUpload",

    data() {
        return {
            file: "",
            message: "",
            error: false,
            uploadedFiles: [],
            legacySystemHTML: ""
        }
    },

    methods: {
        selectFile() {
            const file = this.$refs.file.files[0];
            const allowedTypes = ["application/vnd.ms-excel","application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
            const MAX_SIZE = 10000 * 1000;
           
            var tooLarge = false;

           if (file) {
                tooLarge = file.size > MAX_SIZE;
           }

            if (file) {
                if (allowedTypes.includes(file.type) && !tooLarge) {
                    this.file = file;
                    this.error = false;
                    this.message = "";
                } else {
                    this.error = true;
                    this.message = tooLarge ?  `Too large (${file.size/1000}kB) max size is ${MAX_SIZE/1000}kB` : `Only excel files are allowed - you gave ${file.type}`
                }
            }
        },

        async sendFile() {
            const formData  = new FormData();
            formData.append('file',this.file);

            try {
                const res = await axios.post('/upload', formData);
                this.uploadedFiles.push(res.data.file);
                //this.message = `File has been uploaded ${this.uploadedFiles[0].originalname}`;
                this.message = `Success: please download the converted file from the link below:`;
                this.legacySystemHTML = `<a href="http://${window.location.hostname}:3344/${res.data.file}" target="_blank">http://${window.location.hostname}:3344/${res.data.file}</a>`;
                this.file = "";
                this.error = false;
            } catch(err) {
                //this.message = "Something went wrong";
                this.message = err.response.data.error;
                this.error = true;
            }
        }
    }
}
</script>

