class { 'nubis_apache':
}

# Add modules
class { 'apache::mod::rewrite': }
class { 'apache::mod::proxy': }
class { 'apache::mod::proxy_http': }

apache::vhost { $project_name:
    port               => 80,
    default_vhost      => true,
    docroot            => "/var/www/${project_name}/web",
    docroot_owner      => 'root',
    docroot_group      => 'root',
    block              => ['scm'],
    setenvif           => [
      'X-Forwarded-Proto https HTTPS=on',
      'Remote_Addr 127\.0\.0\.1 internal',
      'Remote_Addr ^10\. internal',
    ],
    access_log_env_var => '!internal',
    access_log_format  => '%a %l %u %t \"%r\" %>s %b \"%{Referer}i\" \"%{User-agent}i\"',

    directories        => [
      {
        path            => "/var/www/${project_name}/web",
        custom_fragment => "
    AddType application/x-font-ttf        .ttf

    ExpiresActive On
    ExpiresDefault none

    # Assets
    ExpiresByType image/* 'modification plus 30 minutes'
    ExpiresByType text/* 'modification plus 30 minutes'

    # Fonts
    ExpiresByType application/x-font-ttf 'modification plus 6 hours'
      ",
      }
    ],


    custom_fragment    => "

    # Don't set default expiry on anything
    ExpiresActive Off

    # Proxy to nodejs ( keep retrying on backend failures )
    ProxyPass /server-status !

    # Handle static content ourselves
    ProxyPass /dist/bundle.js !
    ProxyPass /dist/index.css !
    ProxyPass /img !
    ProxyPass /font !

    ProxyPass / http://localhost:9000/ retry=0
    ProxyPassReverse / http://localhost:9000/

",
    headers            => [
      # Nubis headers
      "set X-Nubis-Version ${project_version}",
      "set X-Nubis-Project ${project_name}",
      "set X-Nubis-Build   ${packer_build_name}",

      # Security Headers
      'set X-Content-Type-Options "nosniff"',
      'set X-XSS-Protection "1; mode=block"',
      'set X-Frame-Options "DENY"',
      'set Strict-Transport-Security "max-age=31536000"',
    ],
    rewrites           => [
      {
        comment      => 'HTTPS redirect',
        rewrite_cond => ['%{HTTP:X-Forwarded-Proto} =http'],
        rewrite_rule => ['. https://%{HTTP:Host}%{REQUEST_URI} [L,R=permanent]'],
      }
    ]
}
