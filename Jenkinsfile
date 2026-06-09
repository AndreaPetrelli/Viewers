pipeline {
  agent any

  options {
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '20', artifactNumToKeepStr: '20'))
    disableConcurrentBuilds()
  }

  parameters {
    string(name: 'RELEASE_VERSION', defaultValue: '3.12.4', description: 'OHIF release version used to name the artifact.')
    string(name: 'PUBLIC_URL', defaultValue: '/assets/ohif3/', description: 'Public URL used by OHIF for generated assets.')
    string(name: 'APP_CONFIG', defaultValue: 'config/default.js', description: 'OHIF app config, relative to platform/app/public.')
    booleanParam(name: 'INSTALL_DEPS', defaultValue: true, description: 'Run yarn install --frozen-lockfile before building.')
    booleanParam(name: 'CLEAN_DIST', defaultValue: true, description: 'Remove platform/app/dist before building.')
  }

  environment {
    NODE_ENV = 'production'
    QUICK_BUILD = 'false'
    DIST_DIR = 'platform/app/dist'
    ARTIFACT_NAME = "ohif3-${RELEASE_VERSION}-${BUILD_NUMBER}.tar.gz"
  }

  stages {
    stage('Validate Toolchain') {
      steps {
        sh '''
          set -eux
          node --version
          yarn --version
        '''
      }
    }

    stage('Install Dependencies') {
      when {
        expression { return params.INSTALL_DEPS }
      }
      steps {
        sh '''
          set -eux
          yarn config set workspaces-experimental true
          yarn install --frozen-lockfile
        '''
      }
    }

    stage('Build OHIF') {
      steps {
        sh '''
          set -eux

          if [ "${CLEAN_DIST}" = "true" ]; then
            rm -rf "${DIST_DIR}"
          fi

          PUBLIC_URL="${PUBLIC_URL}" \
          APP_CONFIG="${APP_CONFIG}" \
          NODE_ENV="${NODE_ENV}" \
          QUICK_BUILD="${QUICK_BUILD}" \
          yarn run build

          test -f "${DIST_DIR}/index.html"
        '''
      }
    }

    stage('Package Artifact') {
      steps {
        sh '''
          set -eux
          tar -C "${DIST_DIR}" -czf "${ARTIFACT_NAME}" .
        '''

        archiveArtifacts artifacts: "${env.ARTIFACT_NAME}, ${env.DIST_DIR}/**", fingerprint: true
      }
    }
  }

  post {
    always {
      sh '''
        set +e
        echo "Branch: ${BRANCH_NAME:-unknown}"
        echo "Commit: $(git rev-parse --short HEAD 2>/dev/null || true)"
        echo "PUBLIC_URL=${PUBLIC_URL}"
        echo "APP_CONFIG=${APP_CONFIG}"
      '''
    }
  }
}
