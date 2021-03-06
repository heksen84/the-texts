/*
------------------------------
 Ilya Bobkov 2017(c) 
 https://github.com/heksen84
------------------------------*/
$(document).ready(function() 
{															
	const MAX_LOAD_SYMBOLS = 10000;	
	
	var reader 			= null;
	var timer  			= null;									
	var scroll_pos 		= 0; 	// позиция скрола
	var read_pos 		= 1;	// позиция считывания текста		
	var full_text_size 	= 0;
	
	sweetAlertInitialize();
	BlurInput();

	if ( localStorage.getItem("rec_id") != "" ) reader = "web";
		
	// --------------------------------
	// назад
	// --------------------------------
	$("#return_link").click(function() {
		window.history.back();
	});

	// ------------------------------------------
	// убрать переход назад
	// ------------------------------------------
	if ( localStorage.getItem( "rec_id" ) != "" ) {	   	
		$("#return_link").off().click(function() {
			$(location).attr( "href", "/" );
		});
	}
	
	// -------------------------
	// лайк
	// -------------------------
	$("#like").click(function() {
		$.ajax
		({
			url: "..//server.php",
			data: 
			{
				"func": "SRV_SetLike",                    
				"record_id": localStorage.getItem("read_data_id"),				
			}, 			
		}).done(function( data ) {										
			var obj = jQuery.parseJSON(data);				
			switch(obj.answer)
			{
				case "error": error(obj.string); break;
				case "warning": warning(obj.string); break;
				case "success": 
				{
				}
			} 
		});
	});

	// ------------------------------
	// получить полный размер текста
	// ------------------------------
	function GetTextFullSize() 
	{
		var size = 0;		
		$.ajax
		({
			url: "..//server.php",
			data: 
			{
				"func": "SRV_GetTextFullSize",                    
				"record_id": localStorage.getItem("read_data_id"),				
			}, 				
			async: false,
		}).done(function( data ) 
		{																
			var obj = jQuery.parseJSON(data);				
			switch(obj.answer)
			{
				case "error": error(obj.string); break;
				case "warning": console.log(obj.string); break;
				case "success": {												
					size = obj.string;
				}
			} 
		});		
		return size;
	}
	
	// ------------------------------
	// установить закладку
	// ------------------------------
	function SetBookmark() 
	{		
		$.ajax
		({
			url: "..//server.php",
			data: 
			{
				"func": "SRV_SetBookMark",                    
				"record_id": localStorage.getItem("read_data_id"),
				"scroll_pos": $(window).scrollTop(), 	// позиция скрола
				"read_pos": read_pos,					// позиция текста
			},
			async:false,
			method: "POST",			
		}).done(function( data ) 
		{													
			var obj = jQuery.parseJSON(data);				
			switch(obj.answer)
			{
				case "error": error(obj.string); break;
				case "warning": console.log(obj.string); break;
				case "success": 
				{									
				}
			} 
		});	  
	}
	
	// -------------------------
	// получить закладку
	// -------------------------
	function GetBookmark()
	{			
		if ( localStorage.getItem("user_name") != "" ) 
		{							
			var bm = new Object();
			
			$.ajax
			({
				url: "..//server.php",
				data: 
				{
					"func": "SRV_GetBookMark",                    
					"record_id": localStorage.getItem("read_data_id"),			
				},			
				async:false,
			}).done(function( data ) 
			{																
				var obj = jQuery.parseJSON(data);												
				switch(obj.answer)
				{					
					case "error": error(obj.string); break;
					case "warning": console.log(obj.string); break;
					case "success": 
					{																				
						if ( obj.string != "" ) {						    																				
							read_pos 	= obj.string[0].read_pos;							
							scroll_pos 	= obj.string[0].scroll_pos;
							
							bm["read_pos"] 	 = obj.string[0].read_pos;
							bm["scroll_pos"] = obj.string[0].scroll_pos;
							
							/* 
							--------------------------------------------
							сброс если текущая позиция текста,
							превышает общий размер текста 
							-------------------------------------------- */							
							full_text_size = GetTextFullSize();
							
							if (read_pos > full_text_size) {
								$( "body, html" ).animate( { scrollTop: 0 }, 0 );
								read_pos 	= 1;
								scroll_pos	= 0;								
								SetBookmark();								
							}
						}																									
						break;
					}
				} 
			});					
		}		
		return bm;
	}
	
	// --------------------------
	// ЗАГРУЗИТЬ ТЕКСТ
	// --------------------------
	function LoadText(pos)
	{					
		NProgress.start();												
		if ( pos == 0 ) pos = 1;		
		$.ajax
		({
			url: "..//server.php",
			data:		
			{
				"func": "SRV_ReadText",                    
				"record_id": localStorage.getItem("read_data_id"),
				"reader": reader,
				"read_pos": pos,
			},
			async:false,
			}).done(function( data ) 
			{										
				var obj = jQuery.parseJSON(data);				
				localStorage.setItem( "rec_id", "" ); // сбросить переход со статической страницы
				switch(obj.answer) 
				{
					case "error": error(obj.string); break;
					case "warning": warning(obj.string); break;
					case "success": 
					{							
						read_pos = pos;
						if (obj.string == "") $(location).attr( "href", "text_not_found.php" ); // редирект, если нет текста						
						if ( read_pos == 1 ) {						
							$("#like").show();																							
							$("#col-previus-text").empty();					
							$("#col-title").html(obj.string[0].title);
							$("#col-desc").html(obj.string[0].description);												
						}
						else {
							$("#col-title, #col-desc").empty();	
							$("#like").hide();																																					
						}
												
						// ------------------
						// добавить кнопку
						// ------------------
						if ( read_pos > 1 ) 
						{
							$("#col-previus-text").empty().append("<button type='button' class='btn btn-success' id='button_previus_text'>назад</button>");
							
							/* -- дальше -- */
							$("#button_previus_text").click(function() {								
								LoadText(read_pos-MAX_LOAD_SYMBOLS);
								SetBookmark(); 
							});
						}											
															
						/* -- добавить текст если он есть -- */
						if( ByteCount(obj.string[0].text) > 0 )
						{							
							var str = obj.string[0].text;
							var cut = str.substr(str.length-513, 513);
								
							$("#col-text").empty().html(obj.string[0].text);					
							$("body,html").animate({ scrollTop: scroll_pos }, 0 );															
							
							// -----------------------------------------------------------														
							$.ajax
							({
								url: "..//server.php",
								data: 
								{
									"func": "SRV_GetLastSymbols",                    
									"record_id": localStorage.getItem("read_data_id"),			
								},			
								async:false,
							}).done(function( data ) 
							{																
								var obj = jQuery.parseJSON(data);												
								switch(obj.answer)
								{														
									case "error": error(obj.string); break;
									case "warning": console.log(obj.string); break;
									case "success": 
									{																														
										if( cut != obj.string ) {
											$("#col-add-more").empty().append("<button type='button' class='btn btn-success' id='button_add_more'>дальше</button>");											
											/* загрузить больше */
											$("#button_add_more").click(function() 
											{																		
												LoadText(read_pos+MAX_LOAD_SYMBOLS);
												$("#totop").trigger("click");
												SetBookmark();
											});												
										}
										else $("#col-add-more").html("<h1>конец</h1>");																					
										break;
									}
								} 
							});
																					
							// -----------------------------------------------------------												   						
						}						
					}
				}
				NProgress.done();				
			});
	}

	/*
	----------------------------------
	прокрутка
	----------------------------------*/
	$(window).scroll(function() 
	{
		if( $(this).scrollTop() > 200 ) 
		{
			if (localStorage.getItem("user_name") != "") {
				$("#bookmark").fadeIn();
			}
			$("#totop").fadeIn();			
		} 
		else $("#totop, #bookmark").fadeOut();				

		 if ( timer ) clearTimeout(timer);
		    timer = setTimeout( function() {				
				SetBookmark();
		    }, 1000 );
	});
 
	/*
	--------------------------------
	Вверх
	--------------------------------
	*/
	$("#totop").click(function() {
		$( "body, html" ).animate( { scrollTop: 0 }, 0 );
	});
	
	GetBookmark();	// получить закладку
	LoadText(1); 	// считать текст	
});