def says_hello(request):
    if request.args and 'keyword' in request.args:
        message = request.args.get('keyword')
    else:
        message = ''

    return 'Shreya Vinodh says ' + message
