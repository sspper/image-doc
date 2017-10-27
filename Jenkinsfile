def doBuild(delivery) {
    def settings = delivery.settings()
    stage('build') {
        def image = docker.build("ssartisan/pearl-squad-artisan-mobile-bff")
        image.push(delivery.branchTag())
        image.push(delivery.branchAndBuildTag())
    }

    if('develop' == delivery.branchTag()) {
        stage('deploy') {
            docker.image(settings.kubectlImage).inside {
                delivery.deploymentUpdateArtisanMobileBff('k8-percipio.paris-squad.com', 'develop', "ssartisan/pearl-squad-artisan-mobile-bff:${delivery.branchAndBuildTag()}")
            }
        }
    }
    if('release' == delivery.branchTag()) {
        stage('deploy') {
            docker.image(settings.kubectlImage).inside {
                delivery.deploymentUpdateArtisanMobileBff('int.squads-dev.com', 'int', "ssartisan/pearl-squad-artisan-mobile-bff:${delivery.branchAndBuildTag()}")
            }
        }
    }
}

/*
COMMONS JOB TEMPLATE V0.1 (subdirectoryCheckout, scmFirst)
SEE: DevOps-chapter/delivery
 */
def delivery
node ('docker') {
    checkout scm

    stage(name: 'delivery') {
        checkout([$class: 'GitSCM', branches: [[name: "*/master"]], doGenerateSubmoduleConfigurations: false, extensions: [[$class: 'RelativeTargetDirectory', relativeTargetDir: 'delivery']], submoduleCfg: [], userRemoteConfigs: [[url: 'git@github.skillsoft.com:DevOps-chapter/delivery.git']]])
        delivery = load 'delivery/delivery.groovy'

        sh 'ls .'
    }

    try {
        delivery.notify("Starting")
        withCredentials([usernamePassword(credentialsId: 'ssbuild', passwordVariable: 'dockerhubPass', usernameVariable: 'dockerhubUser')]) {
            sh "docker login -u ${dockerhubUser} -p ${dockerhubPass}"
        }
        doBuild(delivery) // You implement doBuild

        delivery.notify("SUCCESS")
    } catch (e) {
        currentBuild.result = "FAILED"
        echo "${e.getClass().getName()} - ${e.getMessage()}"
        delivery.notifyFailure("${e.getClass().getName()} - ${e.getMessage()}")
        throw e
    }
}
/*
END COMMONS JOB TEMPLATE
 */
