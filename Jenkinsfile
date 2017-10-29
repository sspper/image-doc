
def doBuild() {
    stage('build') {
        def image = docker.build("ssp25/sspcloud")
        image.push("786")
    }
}

node ('docker') {
    checkout scm

    stage(name: 'delivery') {
        checkout([$class: 'GitSCM', branches: [[name: "*/master"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: 'delivery']], submoduleCfg: [], userRemoteConfigs: [[url: 'https://github.com/sspper/image-doc.git']]])
    }

    try {
        
       withCredentials([usernamePassword(credentialsId: '8bca1236-1fcb-40ea-b19c-07e7eb8910d1', passwordVariable: 'dockerhubPass', usernameVariable: 'dockerhubUser')]) {
           sh "docker login -u ${dockerhubUser} -p ${dockerhubPass}"
        }
        doBuild() // You implement doBuild

        
    } catch (e) {
        currentBuild.result = "FAILED"
        echo "${e.getClass().getName()} - ${e.getMessage()}"
        throw e
    }
}
